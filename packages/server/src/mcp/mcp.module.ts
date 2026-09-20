import { Module, type MiddlewareConsumer, type NestModule } from "@nestjs/common";
import { localhostHostValidation } from "@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js";
import { ConnectionsModule } from "../connections/connections.module.js";
import { TerminalModule } from "../terminal/terminal.module.js";
import { SftpModule } from "../sftp/sftp.module.js";
import { StatsModule } from "../stats/stats.module.js";
import { McpController } from "./mcp.controller.js";

@Module({
  imports: [ConnectionsModule, TerminalModule, SftpModule, StatsModule],
  controllers: [McpController],
})
export class McpModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // DNS-rebinding protection — this endpoint has no auth token, so a same-origin-bypassing
    // request from a malicious page (via DNS trickery pointing "localhost" elsewhere) is the
    // one thing worth guarding against here. Costs nothing for legitimate local requests.
    consumer.apply(localhostHostValidation()).forRoutes(McpController);
  }
}
