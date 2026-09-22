import { Injectable, Inject } from "@nestjs/common";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import type { ClientChannel } from "ssh2";
import { StoreService } from "../store/store.service.js";
import { SshService } from "../ssh/ssh.service.js";

interface Channel {
  connectionId: string;
  stream: ClientChannel;
  emitter: EventEmitter;
  /** How many WebSocket clients are currently attached (viewing/driving this shell). */
  attachedCount: number;
  /** Set when attachedCount drops to 0 — actually tears down the shell once this fires. */
  closeTimer: NodeJS.Timeout | null;
}

@Injectable()
export class TerminalService {
  private channels = new Map<string, Channel>();

  /** How long a shell stays alive with no attached client before it's actually torn down —
   * gives a client whose socket died (network blip, laptop sleep, backend restart) a window
   * to reconnect via terminal:attach and resume the exact same shell, not just a fresh one. */
  private static readonly RECONNECT_GRACE_MS = 60_000;

  constructor(
    @Inject(StoreService) private readonly store: StoreService,
    @Inject(SshService) private readonly ssh: SshService
  ) {}

  async openShell(
    connectionId: string,
    opts: { cols: number; rows: number }
  ): Promise<{ channelId: string; stream: ClientChannel }> {
    const config = this.store.servers.findById(connectionId);
    if (!config) {
      throw new Error("Connection not found");
    }

    const channelId = uuidv4();
    const sshClient = await this.ssh.createSSHConnection(config);
    this.ssh.acquire(connectionId, channelId);

    return new Promise((resolve, reject) => {
      sshClient.shell(
        { term: "xterm-256color", cols: opts.cols || 80, rows: opts.rows || 24 },
        (err, stream) => {
          if (err) {
            this.ssh.release(connectionId, channelId);
            reject(err);
            return;
          }

          const emitter = new EventEmitter();
          this.channels.set(channelId, {
            connectionId,
            stream,
            emitter,
            attachedCount: 1, // the socket that opened this shell counts as attached
            closeTimer: null,
          });

          stream.on("data", (data: Buffer) => {
            emitter.emit("data", data.toString("utf-8"));
          });

          stream.on("close", () => {
            emitter.emit("close");
            const channel = this.channels.get(channelId);
            if (channel?.closeTimer) clearTimeout(channel.closeTimer);
            this.channels.delete(channelId);
            this.ssh.release(connectionId, channelId);
          });

          resolve({ channelId, stream });
        }
      );
    });
  }

  /** Returns any currently-open channel ids for a connection, oldest first. */
  findChannelIds(connectionId: string): string[] {
    const ids: string[] = [];
    for (const [id, channel] of this.channels) {
      if (channel.connectionId === connectionId) ids.push(id);
    }
    return ids;
  }

  /** Lists every currently-open session across all connections. */
  listAll(): { sessionId: string; connectionId: string }[] {
    return [...this.channels].map(([sessionId, channel]) => ({
      sessionId,
      connectionId: channel.connectionId,
    }));
  }

  write(channelId: string, data: string): void {
    this.channels.get(channelId)?.stream.write(data);
  }

  resize(channelId: string, cols: number, rows: number): void {
    this.channels.get(channelId)?.stream.setWindow(rows, cols, 0, 0);
  }

  close(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;
    if (channel.closeTimer) clearTimeout(channel.closeTimer);
    channel.stream.close();
    this.channels.delete(channelId);
    this.ssh.release(channel.connectionId, channelId);
  }

  /** A socket successfully attached (via openShell or terminal:attach) — cancels any
   * pending grace-period teardown, since someone's here now. */
  markAttached(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;
    channel.attachedCount++;
    if (channel.closeTimer) {
      clearTimeout(channel.closeTimer);
      channel.closeTimer = null;
    }
  }

  /** A socket disconnected. Once nothing is attached, starts the grace-period countdown
   * to actually tear the shell down — rather than killing it immediately — so a client
   * whose socket died can reconnect and resume this exact shell instead of a fresh one. */
  markDetached(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;
    channel.attachedCount = Math.max(0, channel.attachedCount - 1);
    if (channel.attachedCount > 0) return;

    channel.closeTimer = setTimeout(() => {
      this.close(channelId);
    }, TerminalService.RECONNECT_GRACE_MS);
  }

  onData(channelId: string, cb: (data: string) => void): () => void {
    const channel = this.channels.get(channelId);
    if (!channel) return () => {};
    channel.emitter.on("data", cb);
    return () => channel.emitter.off("data", cb);
  }

  onClose(channelId: string, cb: () => void): () => void {
    const channel = this.channels.get(channelId);
    if (!channel) return () => {};
    channel.emitter.on("close", cb);
    return () => channel.emitter.off("close", cb);
  }
}
