import { Module } from "@nestjs/common";
import { TerminalGateway } from "./terminal.gateway.js";
import { TerminalService } from "./terminal.service.js";

@Module({
  providers: [TerminalGateway, TerminalService],
  exports: [TerminalService],
})
export class TerminalModule {}
