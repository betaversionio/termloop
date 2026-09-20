import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient, registerTermLoopTools } from "@termloop/client";
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

export async function runMcpServer(port: number): Promise<void> {
  const baseUrl = await ensureDaemon(port);
  const client = createClient({ baseUrl });

  const server = new McpServer({ name: "termloop", version: "0.1.0" });
  registerTermLoopTools(server, client);

  await server.connect(new StdioServerTransport());
}
