import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TermLoopClient } from "./client.js";

/**
 * Runs a shell command to completion and returns its output.
 * If `visible` is set, attaches to an already-open terminal session for this connection so a
 * human watching it sees the command run live, instead of opening a new invisible one. Falls
 * back to a background session (today's behavior) if none is open. Only a background session
 * (one this call created) is closed when done — an attached session is left running.
 */
async function execCommand(
  client: TermLoopClient,
  connectionId: string,
  command: string,
  timeoutMs: number,
  visible: boolean,
  sessionId?: string
): Promise<{ output: string; attached: boolean }> {
  let handle = visible ? await client.terminal.attachToActiveSession(connectionId, sessionId) : null;
  const attached = handle !== null;
  if (!handle) {
    handle = await client.terminal.open(connectionId, { cols: 200, rows: 50 });
  }

  let output = "";

  const result = await new Promise<string>((resolve, reject) => {
    let idleTimer: NodeJS.Timeout;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!attached) handle!.close();
        resolve(output);
      }, 800);
    };

    const hardTimeout = setTimeout(() => {
      if (!attached) handle!.close();
      reject(new Error(`Command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    handle!.onData((data) => {
      output += data;
      resetIdleTimer();
    });
    handle!.onClose(() => {
      clearTimeout(idleTimer);
      clearTimeout(hardTimeout);
      resolve(output);
    });

    handle!.write(`${command}\n`);
    resetIdleTimer();
  });

  return { output: result, attached };
}

/** Registers the standard TermLoop MCP tools against any TermLoopClient — real HTTP or an in-process implementation. */
export function registerTermLoopTools(server: McpServer, client: TermLoopClient): void {
  server.tool(
    "list_connections",
    "List saved SSH server connections (no credentials included)",
    {},
    async () => {
      const connections = await client.connections.list();
      const summarized = connections.map((c) => ({
        id: c.id,
        name: c.name,
        host: c.host,
        port: c.port,
        username: c.username,
      }));
      return { content: [{ type: "text", text: JSON.stringify(summarized, null, 2) }] };
    }
  );

  server.tool(
    "run_command",
    "Run a shell command on a saved SSH connection and return its output",
    {
      connectionId: z.string().describe("The saved connection's id"),
      command: z.string().describe("The shell command to run"),
      timeoutMs: z.number().optional().describe("Max time to wait for output, in ms (default 15000)"),
      visible: z
        .boolean()
        .optional()
        .describe(
          "If true, run inside an already-open terminal session for this connection so the user can watch it live. Falls back to a background run if no session is open (default false)."
        ),
      sessionId: z
        .string()
        .optional()
        .describe(
          "Run inside this exact session (from list_sessions or open_terminal) rather than whichever is found first. Implies visible."
        ),
    },
    async ({ connectionId, command, timeoutMs, visible, sessionId }) => {
      const wantsVisible = visible ?? Boolean(sessionId);
      const { output, attached } = await execCommand(
        client,
        connectionId,
        command,
        timeoutMs ?? 15000,
        wantsVisible,
        sessionId
      );
      const note = wantsVisible && !attached ? "(No open terminal session for this connection — ran in the background.)\n\n" : "";
      return { content: [{ type: "text", text: note + output }] };
    }
  );

  server.tool(
    "open_terminal",
    "Open a persistent SSH terminal session for a connection. It keeps running in the background — " +
      "opening a terminal for the same connection later in the web UI or VS Code attaches to this " +
      "same session instead of starting a new one.",
    {
      connectionId: z.string(),
    },
    async ({ connectionId }) => {
      const existing = await client.terminal.attachToActiveSession(connectionId);
      if (existing) {
        const id = existing.sessionId;
        existing.close(); // just stop observing — never tears down someone else's session
        return {
          content: [{ type: "text", text: `A terminal session is already open for this connection (session ${id}).` }],
        };
      }

      const handle = await client.terminal.open(connectionId, { cols: 80, rows: 24 });
      // Intentionally not closed — this session persists for later attachment.
      return {
        content: [
          {
            type: "text",
            text: `Opened a new terminal session (session ${handle.sessionId}). Open a terminal for this connection in the web UI or VS Code to view it, or reference this session id with run_command/list_sessions.`,
          },
        ],
      };
    }
  );

  server.tool(
    "list_sessions",
    "List currently-open terminal sessions across all connections",
    {},
    async () => {
      const [sessions, connections] = await Promise.all([client.terminal.listSessions(), client.connections.list()]);
      const names = new Map(connections.map((c) => [c.id, c.name]));
      const summarized = sessions.map((s) => ({
        sessionId: s.sessionId,
        connectionId: s.connectionId,
        connectionName: names.get(s.connectionId) ?? "(unknown)",
      }));
      return { content: [{ type: "text", text: JSON.stringify(summarized, null, 2) }] };
    }
  );

  server.tool(
    "read_file",
    "Read a file from a remote server over SFTP",
    {
      connectionId: z.string(),
      path: z.string(),
    },
    async ({ connectionId, path }) => {
      const content = await client.sftp.readFile(connectionId, path);
      return { content: [{ type: "text", text: content }] };
    }
  );

  server.tool(
    "write_file",
    "Write a file to a remote server over SFTP",
    {
      connectionId: z.string(),
      path: z.string(),
      content: z.string(),
    },
    async ({ connectionId, path, content }) => {
      await client.sftp.writeFile(connectionId, path, content);
      return { content: [{ type: "text", text: `Wrote ${content.length} bytes to ${path}` }] };
    }
  );

  server.tool(
    "get_stats",
    "Get live CPU/memory/disk stats for a remote server",
    {
      connectionId: z.string(),
    },
    async ({ connectionId }) => {
      const stats = await client.stats.get(connectionId);
      return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
    }
  );
}
