import { Controller, Get, Inject } from "@nestjs/common";
import type { ApiResponse } from "@termloop/shared";
import { TerminalService } from "./terminal.service.js";

@Controller("terminal")
export class TerminalController {
  constructor(@Inject(TerminalService) private readonly terminal: TerminalService) {}

  @Get("sessions")
  listSessions(): ApiResponse<{ sessionId: string; connectionId: string }[]> {
    return { success: true, data: this.terminal.listAll() };
  }
}
