import { Module } from "@nestjs/common";
import { TerminalGateway } from "./terminal.gateway.js";
import { TerminalService } from "./terminal.service.js";
import { TerminalController } from "./terminal.controller.js";

@Module({
  controllers: [TerminalController],
  providers: [TerminalGateway, TerminalService],
  exports: [TerminalService],
})
export class TerminalModule {}
