import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient } from "@stacklane/client";
import { findRunningDaemon, registerAsDaemon } from "../daemon/discover.js";
import { dynamicImport } from "../dynamicImport.js";

async function ensureDaemon(port: number): Promise<string> {
  const existing = await findRunningDaemon();
  if (existing) {
    return `http://localhost:${existing.port}`;
  }

  // Relative to the bundled dist/index.js output, not to this source file's
  // location — mcp/server.ts and index.ts compile into one bundle.
  const { createApp } = await dynamicImport("./server/main.js");
  const { server, init } = await createApp(port);
  await init();

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => resolve());
  });

  registerAsDaemon(port);
  return `http://localhost:${port}`;
}

/** Runs a shell command to completion and returns its output, closing the channel afterward. */
async function execCommand(
  client: ReturnType<typeof createClient>,
  connectionId: string,
  command: string,
  timeoutMs: number
): Promise<string> {
  const handle = await client.terminal.open(connectionId, { cols: 200, rows: 50 });
  let output = "";

  return new Promise((resolve, reject) => {
    let idleTimer: NodeJS.Timeout;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        handle.close();
        resolve(output);
      }, 800);
    };

    const hardTimeout = setTimeout(() => {
      handle.close();
      reject(new Error(`Command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    handle.onData((data) => {
      output += data;
      resetIdleTimer();
    });
    handle.onClose(() => {
      clearTimeout(idleTimer);
      clearTimeout(hardTimeout);
      resolve(output);
    });

    handle.write(`${command}\n`);
    resetIdleTimer();
  });
}

export async function runMcpServer(port: number): Promise<void> {
  const baseUrl = await ensureDaemon(port);
  const client = createClient({ baseUrl });

  const server = new McpServer({ name: "stacklane", version: "0.1.0" });

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
    },
    async ({ connectionId, command, timeoutMs }) => {
      const output = await execCommand(client, connectionId, command, timeoutMs ?? 15000);
      return { content: [{ type: "text", text: output }] };
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

  await server.connect(new StdioServerTransport());
}
