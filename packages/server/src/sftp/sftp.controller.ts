import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseInterceptors,
  UploadedFile,
  Inject,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import archiver from "archiver";
import type { ApiResponse, RemoteFile } from "@termloop/shared";
import { SftpService } from "./sftp.service.js";

@Controller("sftp")
export class SftpController {
  constructor(@Inject(SftpService) private readonly sftp: SftpService) {}

  @Get(":connectionId/list")
  async list(
    @Param("connectionId") connectionId: string,
    @Query("path") dirPath: string = "/",
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<RemoteFile[]>> {
    try {
      const files = await this.sftp.listDirectory(connectionId, dirPath);
      return { success: true, data: files };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "SFTP error";
      res.status(500);
      return { success: false, error };
    }
  }

  @Get(":connectionId/download")
  async download(
    @Param("connectionId") connectionId: string,
    @Query("path") filePath: string,
    @Res() res: Response
  ): Promise<void> {
    if (!filePath) {
      res.status(400).json({ success: false, error: "Path required" } satisfies ApiResponse);
      return;
    }

    try {
      const sftpWrapper = await this.sftp.getSFTP(connectionId);
      const readStream = sftpWrapper.createReadStream(filePath);

      const filename = filePath.split("/").pop() || "download";
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/octet-stream");

      readStream.pipe(res);
      readStream.on("error", (err: Error) => {
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: err.message } satisfies ApiResponse);
        }
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "SFTP error";
      res.status(500).json({ success: false, error } satisfies ApiResponse);
    }
  }

  @Get(":connectionId/download-folder")
  async downloadFolder(
    @Param("connectionId") connectionId: string,
    @Query("path") dirPath: string,
    @Res() res: Response
  ): Promise<void> {
    if (!dirPath) {
      res.status(400).json({ success: false, error: "Path required" } satisfies ApiResponse);
      return;
    }

    try {
      const folderName = dirPath.split("/").filter(Boolean).pop() ?? "download";
      const filePaths = await this.sftp.collectAllFiles(connectionId, dirPath);

      if (filePaths.length === 0) {
        res.status(404).json({ success: false, error: "Folder is empty" } satisfies ApiResponse);
        return;
      }

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${folderName}.zip"`);

      const archive = archiver("zip", { zlib: { level: 5 } });
      archive.pipe(res);

      const sftpWrapper = await this.sftp.getSFTP(connectionId);

      for (const filePath of filePaths) {
        // Make path relative to the folder being downloaded
        const relativePath = filePath.slice(dirPath.length).replace(/^\//, "");
        if (!relativePath) continue;
        const stream = sftpWrapper.createReadStream(filePath);
        archive.append(stream, { name: relativePath });
      }

      await archive.finalize();
    } catch (err: unknown) {
      if (!res.headersSent) {
        const error = err instanceof Error ? err.message : "SFTP error";
        res.status(500).json({ success: false, error } satisfies ApiResponse);
      }
    }
  }

  @Post(":connectionId/upload")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @Param("connectionId") connectionId: string,
    @Query("path") dirPath: string = "/",
    @UploadedFile() file: Express.Multer.File,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse> {
    if (!file) {
      res.status(400);
      return { success: false, error: "File required" };
    }

    const remotePath = dirPath === "/" ? `/${file.originalname}` : `${dirPath}/${file.originalname}`;

    try {
      const sftpWrapper = await this.sftp.getSFTP(connectionId);
      return await new Promise<ApiResponse>((resolve) => {
        const writeStream = sftpWrapper.createWriteStream(remotePath);

        writeStream.on("close", () => {
          resolve({ success: true, data: { path: remotePath } });
        });

        writeStream.on("error", (err: Error) => {
          res.status(500);
          resolve({ success: false, error: err.message });
        });

        writeStream.end(file.buffer);
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "SFTP error";
      res.status(500);
      return { success: false, error };
    }
  }

  @Delete(":connectionId/delete")
  async remove(
    @Param("connectionId") connectionId: string,
    @Query("path") filePath: string,
    @Query("isDir") isDir: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse> {
    if (!filePath) {
      res.status(400);
      return { success: false, error: "Path required" };
    }

    try {
      await this.sftp.deleteFile(connectionId, filePath, isDir === "true");
      return { success: true };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "SFTP error";
      res.status(500);
      return { success: false, error };
    }
  }

  @Post(":connectionId/rename")
  async rename(
    @Param("connectionId") connectionId: string,
    @Body() body: { oldPath: string; newPath: string },
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse> {
    if (!body.oldPath || !body.newPath) {
      res.status(400);
      return { success: false, error: "oldPath and newPath required" };
    }

    try {
      await this.sftp.rename(connectionId, body.oldPath, body.newPath);
      return { success: true };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "SFTP error";
      res.status(500);
      return { success: false, error };
    }
  }

  @Get(":connectionId/read")
  async readFile(
    @Param("connectionId") connectionId: string,
    @Query("path") filePath: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse<{ content: string }>> {
    if (!filePath) {
      res.status(400);
      return { success: false, error: "Path required" };
    }

    try {
      const content = await this.sftp.readFile(connectionId, filePath);
      return { success: true, data: { content } };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "SFTP error";
      res.status(500);
      return { success: false, error };
    }
  }

  @Post(":connectionId/write")
  async writeFile(
    @Param("connectionId") connectionId: string,
    @Body() body: { path: string; content: string },
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse> {
    if (!body.path) {
      res.status(400);
      return { success: false, error: "Path required" };
    }

    try {
      await this.sftp.writeFile(connectionId, body.path, body.content);
      return { success: true };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "SFTP error";
      res.status(500);
      return { success: false, error };
    }
  }

  @Post(":connectionId/mkdir")
  async mkdir(
    @Param("connectionId") connectionId: string,
    @Body() body: { path: string },
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiResponse> {
    if (!body.path) {
      res.status(400);
      return { success: false, error: "Path required" };
    }

    try {
      await this.sftp.mkdir(connectionId, body.path);
      return { success: true };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "SFTP error";
      res.status(500);
      return { success: false, error };
    }
  }
}
