import { Injectable, Inject } from "@nestjs/common";
import fs from "fs";
import { Client } from "ssh2";
import type { ServerConnection } from "@termloop/shared";
import { StoreService } from "../store/store.service.js";

@Injectable()
export class SshService {
  private activeConnections = new Map<string, Client>();
  private consumers = new Map<string, Set<string>>();

  constructor(@Inject(StoreService) private readonly store: StoreService) {}

  getSSHClient(connectionId: string): Client | undefined {
    return this.activeConnections.get(connectionId);
  }

  /** Registers a consumer (e.g. a terminal shell channel) as using this connection's client. */
  acquire(connectionId: string, consumerId: string): void {
    let set = this.consumers.get(connectionId);
    if (!set) {
      set = new Set();
      this.consumers.set(connectionId, set);
    }
    set.add(consumerId);
  }

  /** Releases a consumer's claim; the underlying client only disconnects once no consumers remain. */
  release(connectionId: string, consumerId: string): void {
    const set = this.consumers.get(connectionId);
    if (!set) return;
    set.delete(consumerId);
    if (set.size === 0) {
      this.consumers.delete(connectionId);
      const client = this.activeConnections.get(connectionId);
      if (client) {
        client.end();
        this.activeConnections.delete(connectionId);
      }
    }
  }

  private resolveKeychainKey(config: ServerConnection): ServerConnection {
    if (
      config.authMethod === 'key' &&
      config.keychainKeyId &&
      !config.privateKey
    ) {
      const key = this.store.keychain.findById(config.keychainKeyId);
      if (key) {
        const resolved = { ...config };
        if (key.type === "text" && key.keyContent) {
          resolved.privateKey = key.keyContent;
        } else if (key.type === "path" && key.keyPath) {
          const expandedPath = key.keyPath.replace(
            /^~/,
            process.env.HOME || process.env.USERPROFILE || ""
          );
          resolved.privateKey = fs.readFileSync(expandedPath, "utf-8");
        }
        if (key.passphrase) {
          resolved.passphrase = key.passphrase;
        }
        return resolved;
      }
    }
    return config;
  }

  createSSHConnection(config: ServerConnection): Promise<Client> {
    return new Promise((resolve, reject) => {
      const existing = this.activeConnections.get(config.id);
      if (existing) {
        resolve(existing);
        return;
      }

      const resolved = this.resolveKeychainKey(config);
      const client = new Client();

      client.on("ready", () => {
        this.activeConnections.set(config.id, client);
        resolve(client);
      });

      client.on("error", (err) => {
        this.activeConnections.delete(config.id);
        reject(err);
      });

      client.on("close", () => {
        this.activeConnections.delete(config.id);
      });

      const connectConfig: Record<string, unknown> = {
        host: resolved.host,
        port: resolved.port,
        username: resolved.username,
        readyTimeout: 10000,
      };

      if (resolved.authMethod === "password") {
        connectConfig.password = resolved.password;
      } else if (resolved.authMethod === "key") {
        connectConfig.privateKey = resolved.privateKey;
        if (resolved.passphrase) {
          connectConfig.passphrase = resolved.passphrase;
        }
      }

      client.connect(connectConfig);
    });
  }

  /** Runs a one-off command to completion (not a persistent shell) and returns its full output. */
  async exec(connectionId: string, command: string): Promise<{ stdout: string; stderr: string; code: number }> {
    const config = this.store.servers.findById(connectionId);
    if (!config) {
      throw new Error("Connection not found");
    }
    const client = await this.createSSHConnection(config);

    return new Promise((resolve, reject) => {
      client.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        let stdout = "";
        let stderr = "";
        stream.on("data", (data: Buffer) => {
          stdout += data.toString();
        });
        stream.stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });
        stream.on("close", (code: number | null) => {
          resolve({ stdout, stderr, code: code ?? 0 });
        });
      });
    });
  }

  /** Unconditionally tears down a connection's client, regardless of active consumers. */
  forceDisconnect(connectionId: string) {
    const client = this.activeConnections.get(connectionId);
    if (client) {
      client.end();
      this.activeConnections.delete(connectionId);
    }
    this.consumers.delete(connectionId);
  }

  disconnectAll() {
    for (const [id, client] of this.activeConnections) {
      client.end();
      this.activeConnections.delete(id);
    }
    this.consumers.clear();
  }
}
