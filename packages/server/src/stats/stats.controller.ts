import { Controller, Get, Param, Query, Res, Inject } from "@nestjs/common";
import type { Response } from "express";
import type { ApiResponse, ServerStats, ServerSystemInfo, ProcessInfo } from "@termloop/shared";
import { StatsService } from "./stats.service.js";

@Controller("stats")
export class StatsController {
  constructor(@Inject(StatsService) private readonly stats: StatsService) {}

  @Get(":connectionId")
  async get(
    @Param("connectionId") connectionId: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<ServerStats>> {
    try {
      const data = await this.stats.getStats(connectionId);
      return { success: true, data };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Failed to get stats";
      res.status(500);
      return { success: false, error };
    }
  }

  @Get(":connectionId/processes")
  async getProcesses(
    @Param("connectionId") connectionId: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<ProcessInfo[]>> {
    try {
      const data = await this.stats.getProcesses(connectionId);
      return { success: true, data };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Failed to get processes";
      res.status(500);
      return { success: false, error };
    }
  }

  @Get(":connectionId/system-info")
  async getSystemInfo(
    @Param("connectionId") connectionId: string,
    @Query("refresh") refresh: string | undefined,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<ServerSystemInfo>> {
    try {
      const data = await this.stats.getSystemInfo(connectionId, refresh === "true");
      return { success: true, data };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Failed to get system info";
      res.status(500);
      return { success: false, error };
    }
  }
}
