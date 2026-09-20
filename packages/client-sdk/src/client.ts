import WebSocket from "ws";
import type {
  ApiResponse,
  RemoteFile,
  ServerConnection,
  ServerConnectionInput,
  ServerStats,
  ServerSystemInfo,
  WsMessage,
} from "@stacklane/shared";

export type { RemoteFile, ServerConnection, ServerConnectionInput, ServerStats, ServerSystemInfo };

export interface TerminalHandle {
  write(data: string): void;
  resize(cols: number, rows: number): void;
  onData(cb: (data: string) => void): () => void;
  onClose(cb: () => void): void;
  close(): void;
}

export interface StackLaneClient {
  connections: {
    list(): Promise<ServerConnection[]>;
    get(id: string): Promise<ServerConnection>;
    create(input: ServerConnectionInput): Promise<ServerConnection>;
    test(id: string): Promise<{ connected: boolean }>;
  };
  terminal: {
    open(connectionId: string, opts: { cols: number; rows: number }): Promise<TerminalHandle>;
  };
  sftp: {
    list(connectionId: string, path: string): Promise<RemoteFile[]>;
    readFile(connectionId: string, path: string): Promise<string>;
    writeFile(connectionId: string, path: string, content: string): Promise<void>;
    mkdir(connectionId: string, path: string): Promise<void>;
    remove(connectionId: string, path: string, isDir: boolean): Promise<void>;
    rename(connectionId: string, oldPath: string, newPath: string): Promise<void>;
  };
  stats: {
    get(connectionId: string): Promise<ServerStats>;
    systemInfo(connectionId: string): Promise<ServerSystemInfo>;
  };
}

export function createClient(opts: { baseUrl: string }): StackLaneClient {
  const baseUrl = opts.baseUrl.replace(/\/$/, "");
  const wsUrl = baseUrl.replace(/^http/, "ws");

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    const body = (await res.json()) as ApiResponse<T>;
    if (!body.success) {
      throw new Error(body.error || `Request to ${path} failed`);
    }
    return body.data as T;
  }

  return {
    connections: {
      list: () => request<ServerConnection[]>("/connections"),
      get: (id) => request<ServerConnection>(`/connections/${id}`),
      create: (input) =>
        request<ServerConnection>("/connections", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      test: (id) => request<{ connected: boolean }>(`/connections/${id}/test`, { method: "POST" }),
    },

    terminal: {
      open(connectionId, { cols, rows }) {
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(`${wsUrl}/ws/terminal`);
          const dataListeners = new Set<(data: string) => void>();
          const closeListeners = new Set<() => void>();
          let settled = false;

          ws.on("open", () => {
            const handshake: WsMessage = { type: "terminal:input", connectionId, cols, rows };
            ws.send(JSON.stringify(handshake));
          });

          ws.on("message", (raw) => {
            const msg: WsMessage = JSON.parse(raw.toString());
            if (msg.type === "terminal:connected" && !settled) {
              settled = true;
              resolve({
                write: (data) => ws.send(JSON.stringify({ type: "terminal:input", connectionId, data } satisfies WsMessage)),
                resize: (c, r) => ws.send(JSON.stringify({ type: "terminal:resize", connectionId, cols: c, rows: r } satisfies WsMessage)),
                onData: (cb) => {
                  dataListeners.add(cb);
                  return () => dataListeners.delete(cb);
                },
                onClose: (cb) => closeListeners.add(cb),
                close: () => ws.close(),
              });
            } else if (msg.type === "terminal:output" && msg.data) {
              for (const cb of dataListeners) cb(msg.data);
            } else if (msg.type === "terminal:error" && !settled) {
              settled = true;
              reject(new Error(msg.error || "Terminal error"));
            } else if (msg.type === "terminal:close") {
              for (const cb of closeListeners) cb();
            }
          });

          ws.on("error", (err) => {
            if (!settled) {
              settled = true;
              reject(err);
            }
          });

          ws.on("close", () => {
            for (const cb of closeListeners) cb();
          });
        });
      },
    },

    sftp: {
      list: (connectionId, path) =>
        request<RemoteFile[]>(`/sftp/${connectionId}/list?path=${encodeURIComponent(path)}`),
      readFile: async (connectionId, path) => {
        const data = await request<{ content: string }>(
          `/sftp/${connectionId}/read?path=${encodeURIComponent(path)}`
        );
        return data.content;
      },
      writeFile: (connectionId, path, content) =>
        request<void>(`/sftp/${connectionId}/write`, {
          method: "POST",
          body: JSON.stringify({ path, content }),
        }),
      mkdir: (connectionId, path) =>
        request<void>(`/sftp/${connectionId}/mkdir`, {
          method: "POST",
          body: JSON.stringify({ path }),
        }),
      remove: (connectionId, path, isDir) =>
        request<void>(
          `/sftp/${connectionId}/delete?path=${encodeURIComponent(path)}&isDir=${isDir}`,
          { method: "DELETE" }
        ),
      rename: (connectionId, oldPath, newPath) =>
        request<void>(`/sftp/${connectionId}/rename`, {
          method: "POST",
          body: JSON.stringify({ oldPath, newPath }),
        }),
    },

    stats: {
      get: (connectionId) => request<ServerStats>(`/stats/${connectionId}`),
      systemInfo: (connectionId) => request<ServerSystemInfo>(`/stats/${connectionId}/system-info`),
    },
  };
}
