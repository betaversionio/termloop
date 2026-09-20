import { Module } from "@nestjs/common";
import { StoreModule } from "./store/store.module.js";
import { SshModule } from "./ssh/ssh.module.js";
import { HealthModule } from "./health/health.module.js";
import { ConnectionsModule } from "./connections/connections.module.js";
import { KeychainModule } from "./keychain/keychain.module.js";
import { StorageModule } from "./storage/storage.module.js";
import { ProjectsModule } from "./projects/projects.module.js";
import { SftpModule } from "./sftp/sftp.module.js";
import { StatsModule } from "./stats/stats.module.js";
import { TerminalModule } from "./terminal/terminal.module.js";
import { TunnelModule } from "./tunnel/tunnel.module.js";
import { McpModule } from "./mcp/mcp.module.js";

@Module({
  imports: [
    StoreModule,
    SshModule,
    HealthModule,
    ConnectionsModule,
    KeychainModule,
    StorageModule,
    ProjectsModule,
    SftpModule,
    StatsModule,
    TerminalModule,
    TunnelModule,
    McpModule,
  ],
})
export class AppModule {}
