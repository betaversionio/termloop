import { Module } from "@nestjs/common";
import { SftpController } from "./sftp.controller.js";
import { SftpService } from "./sftp.service.js";

@Module({
  controllers: [SftpController],
  providers: [SftpService],
  exports: [SftpService],
})
export class SftpModule {}
