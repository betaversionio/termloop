import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { WsAdapter } from "@nestjs/platform-ws";
import { RequestMethod } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { Express } from "express";
import type { Server } from "http";
import { AppModule } from "./app.module.js";

// MCP clients (e.g. `claude mcp add termloop http://localhost:<port>/mcp`) expect the
// endpoint at a plain path, not nested under the REST API's /api prefix.
const GLOBAL_PREFIX_OPTIONS = { exclude: [{ path: "mcp", method: RequestMethod.ALL }] };

export async function createApp(port = 3721): Promise<{ app: Express; server: Server; port: number; init: () => Promise<void> }> {
  const nestApp = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    logger: false,
  });

  nestApp.setGlobalPrefix("api", GLOBAL_PREFIX_OPTIONS);
  nestApp.useWebSocketAdapter(new WsAdapter(nestApp));

  const expressApp = nestApp.getHttpAdapter().getInstance() as Express;
  const httpServer = nestApp.getHttpServer() as Server;

  return {
    app: expressApp,
    server: httpServer,
    port,
    init: () => nestApp.init().then(() => undefined),
  };
}

export async function startServer(port = 3721) {
  const nestApp = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  nestApp.setGlobalPrefix("api", GLOBAL_PREFIX_OPTIONS);
  nestApp.useWebSocketAdapter(new WsAdapter(nestApp));

  await nestApp.listen(port);
  console.log(`TermLoop server running on http://localhost:${port}`);

  return nestApp.getHttpServer();
}

// Direct execution
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("main.ts") || process.argv[1].endsWith("main.js"));

if (isDirectRun) {
  startServer(3721);
}
