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
}

@Injectable()
export class TerminalService {
  private channels = new Map<string, Channel>();

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
          this.channels.set(channelId, { connectionId, stream, emitter });

          stream.on("data", (data: Buffer) => {
            emitter.emit("data", data.toString("utf-8"));
          });

          stream.on("close", () => {
            emitter.emit("close");
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
    channel.stream.close();
    this.channels.delete(channelId);
    this.ssh.release(channel.connectionId, channelId);
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
