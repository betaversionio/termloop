import { Global, Module } from "@nestjs/common";
import { SshService } from "./ssh.service.js";
import { SshController } from "./ssh.controller.js";

@Global()
@Module({
  controllers: [SshController],
  providers: [SshService],
  exports: [SshService],
})
export class SshModule {}
