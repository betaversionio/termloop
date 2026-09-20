import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Res,
  Req,
  Inject,
} from "@nestjs/common";
import type { Request, Response } from "express";
import archiver from "archiver";
import type {
  ApiResponse,
  BucketInfo,
  BucketObjectListing,
  BucketStats,
} from "@termloop/shared";
import { StorageClientService } from "./storage-client.service.js";

@Controller("storage/:credentialId/explore")
export class StorageExplorerController {
  constructor(
    @Inject(StorageClientService)
    private readonly storage: StorageClientService
  ) {}

  @Get("buckets")
  async listBuckets(
    @Param("credentialId") credentialId: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<BucketInfo[]>> {
    try {
      const buckets = await this.storage.listBuckets(credentialId);
      return { success: true, data: buckets };
    } catch (err: any) {
      res.status(400);
      return { success: false, error: err.message };
    }
  }

  @Get("objects")
  async listObjects(
    @Param("credentialId") credentialId: string,
    @Query("bucket") bucket: string,
    @Query("prefix") prefix: string,
    @Query("token") token: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<BucketObjectListing>> {
    try {
      const listing = await this.storage.listObjects(
        credentialId,
        bucket,
        prefix || undefined,
        token || undefined
      );
      return { success: true, data: listing };
    } catch (err: any) {
      res.status(400);
      return { success: false, error: err.message };
    }
  }

  @Get("stats")
  async getStats(
    @Param("credentialId") credentialId: string,
    @Query("bucket") bucket: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<BucketStats>> {
    try {
      const stats = await this.storage.getBucketStats(credentialId, bucket);
      return { success: true, data: stats };
    } catch (err: any) {
      res.status(400);
      return { success: false, error: err.message };
    }
  }

  @Get("download")
  async getDownloadUrl(
    @Param("credentialId") credentialId: string,
    @Query("bucket") bucket: string,
    @Query("key") key: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<string>> {
    try {
      const url = await this.storage.getPresignedDownloadUrl(
        credentialId,
        bucket,
        key
      );
      return { success: true, data: url };
    } catch (err: any) {
      res.status(400);
      return { success: false, error: err.message };
    }
  }

  @Get("view")
  async getViewUrl(
    @Param("credentialId") credentialId: string,
    @Query("bucket") bucket: string,
    @Query("key") key: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<string>> {
    try {
      const url = await this.storage.getPresignedViewUrl(
        credentialId,
        bucket,
        key
      );
      return { success: true, data: url };
    } catch (err: any) {
      res.status(400);
      return { success: false, error: err.message };
    }
  }

  @Post("upload")
  async uploadObject(
    @Param("credentialId") credentialId: string,
    @Query("bucket") bucket: string,
    @Query("prefix") prefix: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse> {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.from(chunk));
      }
      const body = Buffer.concat(chunks);
      const fileName = (req.headers["x-file-name"] as string) || "upload";
      const contentType =
        (req.headers["content-type"] as string) || "application/octet-stream";
      const key = (prefix || "") + fileName;

      await this.storage.uploadObject(
        credentialId,
        bucket,
        key,
        body,
        contentType
      );
      res.status(201);
      return { success: true };
    } catch (err: any) {
      res.status(400);
      return { success: false, error: err.message };
    }
  }

  @Get("folder/download")
  async downloadFolder(
    @Param("credentialId") credentialId: string,
    @Query("bucket") bucket: string,
    @Query("prefix") prefix: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      if (!prefix) {
        res.status(400).json({ success: false, error: "Prefix is required" });
        return;
      }

      const folderName =
        prefix.split("/").filter(Boolean).pop() ?? "download";
      const keys = await this.storage.listAllKeys(credentialId, bucket, prefix);

      if (keys.length === 0) {
        res.status(404).json({ success: false, error: "Folder is empty" });
        return;
      }

      res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${folderName}.zip"`,
      });

      const archive = archiver("zip", { zlib: { level: 5 } });
      archive.pipe(res);

      for (const key of keys) {
        const relativePath = key.slice(prefix.length);
        if (!relativePath) continue;
        const buffer = await this.storage.getObjectBuffer(
          credentialId,
          bucket,
          key
        );
        archive.append(buffer, { name: relativePath });
      }

      await archive.finalize();
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(400).json({ success: false, error: err.message });
      }
    }
  }

  @Delete("objects")
  async deleteObjects(
    @Param("credentialId") credentialId: string,
    @Query("bucket") bucket: string,
    @Query("key") key: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse> {
    try {
      if (key) {
        await this.storage.deleteObject(credentialId, bucket, key);
      }
      return { success: true };
    } catch (err: any) {
      res.status(400);
      return { success: false, error: err.message };
    }
  }

  @Delete("folder")
  async deleteFolder(
    @Param("credentialId") credentialId: string,
    @Query("bucket") bucket: string,
    @Query("prefix") prefix: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse> {
    try {
      if (!prefix) {
        res.status(400);
        return { success: false, error: "Prefix is required" };
      }
      await this.storage.deleteFolder(credentialId, bucket, prefix);
      return { success: true };
    } catch (err: any) {
      res.status(400);
      return { success: false, error: err.message };
    }
  }
}
