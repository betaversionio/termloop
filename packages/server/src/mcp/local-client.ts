import type { TermLoopClient, TerminalHandle } from "@termloop/client";
import { ConnectionsService } from "../connections/connections.service.js";
import { TerminalService } from "../terminal/terminal.service.js";
import { SftpService } from "../sftp/sftp.service.js";
import { StatsService } from "../stats/stats.service.js";

/** Wraps an already-open channel; `owns` controls whether close() actually tears it down. */
function wrapChannel(terminal: TerminalService, channelId: string, owns: boolean): TerminalHandle {
  return {
    sessionId: channelId,
    write: (data) => terminal.write(channelId, data),
    resize: (c, r) => terminal.resize(channelId, c, r),
    onData: (cb) => terminal.onData(channelId, cb),
    onClose: (cb) => {
      terminal.onClose(channelId, cb);
    },
    close: () => {
      if (owns) terminal.close(channelId);
    },
  };
}

/**
 * Implements the same TermLoopClient interface the real HTTP client does, but calls the
 * daemon's own services directly — no loopback HTTP request to itself.
 */
export function createLocalClient(services: {
  connections: ConnectionsService;
  terminal: TerminalService;
  sftp: SftpService;
  stats: StatsService;
}): TermLoopClient {
  const { connections, terminal, sftp, stats } = services;

  return {
    connections: {
      async list() {
        return connections.list();
      },
      async get(id) {
        const connection = connections.get(id);
        if (!connection) throw new Error("Connection not found");
        return connection;
      },
      async create(input) {
        return connections.create(input);
      },
      async update(id, updates) {
        const updated = connections.update(id, updates);
        if (!updated) throw new Error("Connection not found");
        return updated;
      },
      async delete(id) {
        const deleted = connections.delete(id);
        if (!deleted) throw new Error("Connection not found");
      },
      async test(id) {
        const result = await connections.test(id);
        if ("error" in result) throw new Error(result.error);
        return result;
      },
    },

    terminal: {
      async open(connectionId, { cols, rows }) {
        const { channelId } = await terminal.openShell(connectionId, { cols, rows });
        return wrapChannel(terminal, channelId, true);
      },
      async attachToActiveSession(connectionId, sessionId) {
        const candidates = terminal.findChannelIds(connectionId);
        const channelId = sessionId ? candidates.find((id) => id === sessionId) : candidates[0];
        if (!channelId) return null;
        return wrapChannel(terminal, channelId, false);
      },
      async listSessions() {
        return terminal.listAll();
      },
    },

    sftp: {
      list: (connectionId, path) => sftp.listDirectory(connectionId, path),
      readFile: (connectionId, path) => sftp.readFile(connectionId, path),
      writeFile: (connectionId, path, content) => sftp.writeFile(connectionId, path, content),
      mkdir: (connectionId, path) => sftp.mkdir(connectionId, path),
      remove: (connectionId, path, isDir) => sftp.deleteFile(connectionId, path, isDir),
      rename: (connectionId, oldPath, newPath) => sftp.rename(connectionId, oldPath, newPath),
    },

    stats: {
      get: (connectionId) => stats.getStats(connectionId),
      systemInfo: (connectionId) => stats.getSystemInfo(connectionId, false),
    },
  };
}
