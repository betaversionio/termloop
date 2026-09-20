import { Controller, Post, Get, Delete, Param, Body, Res, Inject } from "@nestjs/common";
import type { Response } from "express";
import type { ApiResponse } from "@termloop/shared";
import { TunnelService } from "./tunnel.service.js";

interface TunnelBody {
  remoteHost: string;
  remotePort: number;
}

interface TunnelResult {
  id: string;
  localPort: number;
}

interface TunnelListItem {
  id: string;
  remoteHost: string;
  remotePort: number;
  localPort: number;
}

@Controller("tunnel")
export class TunnelController {
  constructor(@Inject(TunnelService) private readonly tunnels: TunnelService) {}

  @Post(":connectionId")
  async create(
    @Param("connectionId") connectionId: string,
    @Body() body: TunnelBody,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<TunnelResult>> {
    try {
      const result = await this.tunnels.create(
        connectionId,
        body.remoteHost,
        body.remotePort
      );
      return { success: true, data: result };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Failed to create tunnel";
      res.status(500);
      return { success: false, error };
    }
  }

  @Get(":connectionId")
  list(
    @Param("connectionId") connectionId: string
  ): ApiResponse<TunnelListItem[]> {
    const data = this.tunnels.list(connectionId);
    return { success: true, data };
  }

  @Delete(":connectionId")
  destroy(
    @Param("connectionId") connectionId: string,
    @Body() body: TunnelBody
  ): ApiResponse {
    const id = `${connectionId}:${body.remoteHost}:${body.remotePort}`;
    this.tunnels.destroy(id);
    return { success: true };
  }
}
