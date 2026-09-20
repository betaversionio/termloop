import { Controller, Get, Post, Put, Delete, Param, Body, Res, Inject } from "@nestjs/common";
import type { Response } from "express";
import type { ApiResponse, SSHKey, SSHKeyInput } from "@termloop/shared";
import { KeychainService } from "./keychain.service.js";

@Controller("keychain")
export class KeychainController {
  constructor(@Inject(KeychainService) private readonly keychain: KeychainService) {}

  @Get()
  list(): ApiResponse<SSHKey[]> {
    return { success: true, data: this.keychain.list() };
  }

  @Get(":id")
  get(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse<SSHKey> | ApiResponse {
    const key = this.keychain.get(id);
    if (!key) {
      res.status(404);
      return { success: false, error: "SSH key not found" };
    }
    return { success: true, data: key };
  }

  @Post()
  create(
    @Body() input: SSHKeyInput,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse<SSHKey> {
    const key = this.keychain.create(input);
    res.status(201);
    return { success: true, data: key };
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() updates: Partial<SSHKey>,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse<SSHKey> | ApiResponse {
    const updated = this.keychain.update(id, updates);
    if (!updated) {
      res.status(404);
      return { success: false, error: "SSH key not found" };
    }
    return { success: true, data: updated };
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse {
    const deleted = this.keychain.delete(id);
    if (!deleted) {
      res.status(404);
      return { success: false, error: "SSH key not found" };
    }
    return { success: true };
  }
}
