import { Controller, Post, Param, Body, Res, Inject } from "@nestjs/common";
import type { Response } from "express";
import type { ApiResponse } from "@termloop/shared";
import { SshService } from "./ssh.service.js";

interface ExecResult {
  stdout: string;
  stderr: string;
  code: number;
}

@Controller("ssh")
export class SshController {
  constructor(@Inject(SshService) private readonly ssh: SshService) {}

  @Post(":id/exec")
  async exec(
    @Param("id") id: string,
    @Body() body: { command?: string },
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<ExecResult>> {
    if (!body?.command) {
      res.status(400);
      return { success: false, error: "command is required" };
    }

    try {
      const result = await this.ssh.exec(id, body.command);
      return { success: true, data: result };
    } catch (err) {
      res.status(500);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
