import { Controller, Get, Post, Put, Delete, Param, Body, Res, Inject } from "@nestjs/common";
import type { Response } from "express";
import type { ApiResponse, StorageCredential, StorageCredentialInput } from "@termloop/shared";
import { StorageService } from "./storage.service.js";
import { StorageClientService } from "./storage-client.service.js";

@Controller("storage")
export class StorageController {
  constructor(
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(StorageClientService) private readonly storageClient: StorageClientService,
  ) {}

  @Get()
  list(): ApiResponse<StorageCredential[]> {
    return { success: true, data: this.storage.list() };
  }

  @Get(":id")
  get(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse<StorageCredential> | ApiResponse {
    const cred = this.storage.get(id);
    if (!cred) {
      res.status(404);
      return { success: false, error: "Storage credential not found" };
    }
    return { success: true, data: cred };
  }

  @Post("test")
  async testDirect(
    @Body() input: StorageCredentialInput,
  ): Promise<ApiResponse> {
    try {
      await this.storageClient.testDirect(input);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Post()
  create(
    @Body() input: StorageCredentialInput,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse<StorageCredential> {
    const cred = this.storage.create(input);
    res.status(201);
    return { success: true, data: cred };
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() updates: Partial<StorageCredential>,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse<StorageCredential> | ApiResponse {
    const updated = this.storage.update(id, updates);
    if (!updated) {
      res.status(404);
      return { success: false, error: "Storage credential not found" };
    }
    return { success: true, data: updated };
  }

  @Post(":id/test")
  async test(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse> {
    const cred = this.storage.get(id);
    if (!cred) {
      res.status(404);
      return { success: false, error: "Storage credential not found" };
    }
    try {
      await this.storageClient.listBuckets(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse {
    const deleted = this.storage.delete(id);
    if (!deleted) {
      res.status(404);
      return { success: false, error: "Storage credential not found" };
    }
    return { success: true };
  }
}
