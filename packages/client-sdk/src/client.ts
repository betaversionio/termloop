import WebSocket from "ws";
import type {
  ApiResponse,
  RemoteFile,
  ServerConnection,
  ServerConnectionInput,
  ServerStats,
  ServerSystemInfo,
  WsMessage,
} from "@termloop/shared";

export type { RemoteFile, ServerConnection, ServerConnectionInput, ServerStats, ServerSystemInfo };

export interface TerminalHandle {
  readonly sessionId: string;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  onData(cb: (data: string) => void): () => void;
  onClose(cb: () => void): void;
  close(): void;
}

export interface TermLoopClient {
  connections: {
    list(): Promise<ServerConnection[]>;
    get(id: string): Promise<ServerConnection>;
    create(input: ServerConnectionInput): Promise<ServerConnection>;
    test(id: string): Promise<{ connected: boolean }>;
  };
  terminal: {
    open(connectionId: string, opts: { cols: number; rows: number }): Promise<TerminalHandle>;
    /** Attaches to an open session for this connection (a specific one if sessionId is given,
     * otherwise whichever is found first), or resolves null if none is open. */
    attachToActiveSession(connectionId: string, sessionId?: string): Promise<TerminalHandle | null>;
    /** Lists every currently-open session across all connections. */
    listSessions(): Promise<{ sessionId: string; connectionId: string }[]>;
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

interface TerminalSocket {
  ws: WebSocket;
  sessionId: string;
  dataListeners: Set<(data: string) => void>;
  closeListeners: Set<() => void>;
}

/** Opens a /ws/terminal socket and sends the given handshake, resolving once the server confirms
 * (or a distinguishable {error} if the server replies terminal:error — the socket is closed either way). */
function connectTerminalSocket(
  wsUrl: string,
  handshake: WsMessage
): Promise<TerminalSocket | { error: string }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}/ws/terminal`);
    const dataListeners = new Set<(data: string) => void>();
    const closeListeners = new Set<() => void>();
    let settled = false;

    ws.on("open", () => ws.send(JSON.stringify(handshake)));

    ws.on("message", (raw) => {
      const msg: WsMessage = JSON.parse(raw.toString());
      if (msg.type === "terminal:connected" && !settled) {
        settled = true;
        resolve({ ws, sessionId: msg.sessionId ?? "", dataListeners, closeListeners });
      } else if (msg.type === "terminal:output" && msg.data) {
        for (const cb of dataListeners) cb(msg.data);
      } else if (msg.type === "terminal:error" && !settled) {
        settled = true;
        ws.close();
        resolve({ error: msg.error || "Terminal error" });
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
}

function terminalHandle(connectionId: string, socket: TerminalSocket): TerminalHandle {
  const { ws, sessionId, dataListeners, closeListeners } = socket;
  return {
    sessionId,
    write: (data) => ws.send(JSON.stringify({ type: "terminal:input", connectionId, data } satisfies WsMessage)),
    resize: (c, r) => ws.send(JSON.stringify({ type: "terminal:resize", connectionId, cols: c, rows: r } satisfies WsMessage)),
    onData: (cb) => {
      dataListeners.add(cb);
      return () => dataListeners.delete(cb);
    },
    onClose: (cb) => closeListeners.add(cb),
    close: () => ws.close(),
  };
}

export function createClient(opts: { baseUrl: string }): TermLoopClient {
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
      async open(connectionId, { cols, rows }) {
        const result = await connectTerminalSocket(wsUrl, { type: "terminal:input", connectionId, cols, rows });
        if ("error" in result) throw new Error(result.error);
        return terminalHandle(connectionId, result);
      },
      async attachToActiveSession(connectionId, sessionId) {
        const result = await connectTerminalSocket(wsUrl, { type: "terminal:attach", connectionId, sessionId });
        if ("error" in result) return null;
        return terminalHandle(connectionId, result);
      },
      listSessions: () => request<{ sessionId: string; connectionId: string }[]>("/terminal/sessions"),
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
