import { Controller, Get, Post, Put, Delete, Param, Body, Res, Inject } from "@nestjs/common";
import type { Response } from "express";
import type { ApiResponse, ServerConnection, ServerConnectionInput } from "@termloop/shared";
import { ConnectionsService } from "./connections.service.js";

@Controller("connections")
export class ConnectionsController {
  constructor(@Inject(ConnectionsService) private readonly connections: ConnectionsService) {}

  @Get()
  list(): ApiResponse<ServerConnection[]> {
    return { success: true, data: this.connections.list() };
  }

  @Get(":id")
  get(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse<ServerConnection> | ApiResponse {
    const connection = this.connections.get(id);
    if (!connection) {
      res.status(404);
      return { success: false, error: "Connection not found" };
    }
    return { success: true, data: connection };
  }

  @Post()
  create(
    @Body() input: ServerConnectionInput,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse<ServerConnection> {
    const connection = this.connections.create(input);
    res.status(201);
    return { success: true, data: connection };
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() updates: Partial<ServerConnection>,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse<ServerConnection> | ApiResponse {
    const updated = this.connections.update(id, updates);
    if (!updated) {
      res.status(404);
      return { success: false, error: "Connection not found" };
    }
    return { success: true, data: updated };
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse {
    const deleted = this.connections.delete(id);
    if (!deleted) {
      res.status(404);
      return { success: false, error: "Connection not found" };
    }
    return { success: true };
  }

  @Post("test")
  async testDirect(
    @Body() input: ServerConnectionInput
  ): Promise<ApiResponse> {
    const result = await this.connections.testDirect(input);
    if ("error" in result) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result };
  }

  @Post(":id/test")
  async test(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse> {
    const connection = this.connections.get(id);
    if (!connection) {
      res.status(404);
      return { success: false, error: "Connection not found" };
    }

    const result = await this.connections.test(id);
    if ("error" in result) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result };
  }
}
