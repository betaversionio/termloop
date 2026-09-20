import { Controller, Get, Post, Delete, Req, Res, Inject } from "@nestjs/common";
import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTermLoopTools } from "@termloop/client";
import { ConnectionsService } from "../connections/connections.service.js";
import { TerminalService } from "../terminal/terminal.service.js";
import { SftpService } from "../sftp/sftp.service.js";
import { StatsService } from "../stats/stats.service.js";
import { createLocalClient } from "./local-client.js";

@Controller("mcp")
export class McpController {
  constructor(
    @Inject(ConnectionsService) private readonly connections: ConnectionsService,
    @Inject(TerminalService) private readonly terminal: TerminalService,
    @Inject(SftpService) private readonly sftp: SftpService,
    @Inject(StatsService) private readonly stats: StatsService
  ) {}

  @Post()
  async handlePost(@Req() req: Request, @Res() res: Response): Promise<void> {
    const client = createLocalClient({
      connections: this.connections,
      terminal: this.terminal,
      sftp: this.sftp,
      stats: this.stats,
    });

    const server = new McpServer({ name: "termloop", version: "0.1.0" });
    registerTermLoopTools(server, client);

    try {
      // Stateless mode: no session ID, no session validation — a fresh server + transport
      // per request. Right for simple request/response tool calls with no server push.
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on("close", () => {
        transport.close();
        server.close();
      });
    } catch (err: unknown) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  }

  @Get()
  handleGet(@Res() res: Response): void {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    });
  }

  @Delete()
  handleDelete(@Res() res: Response): void {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    });
  }
}
