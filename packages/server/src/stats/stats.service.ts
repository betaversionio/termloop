import { Injectable, Inject } from "@nestjs/common";
import { Client } from "ssh2";
import type { ServerStats, ServerSystemInfo, ProcessInfo } from "@termloop/shared";
import { StoreService } from "../store/store.service.js";
import { SshService } from "../ssh/ssh.service.js";

@Injectable()
export class StatsService {
  constructor(
    @Inject(StoreService) private readonly store: StoreService,
    @Inject(SshService) private readonly ssh: SshService
  ) {}

  async getSystemInfo(
    connectionId: string,
    refresh = false,
  ): Promise<ServerSystemInfo> {
    const config = this.store.servers.findById(connectionId);
    if (!config) {
      throw new Error('Connection not found');
    }

    if (!refresh && config.systemInfo) {
      return config.systemInfo;
    }

    const client = await this.ssh.createSSHConnection(config);
    const [osRelease, kernel, arch, platform] = await Promise.all([
      this.execCommand(client, "cat /etc/os-release 2>/dev/null || echo ''"),
      this.execCommand(client, 'uname -r'),
      this.execCommand(client, 'uname -m'),
      this.execCommand(client, 'uname -s'),
    ]);

    let distro = 'Unknown';
    let distroId = 'unknown';
    for (const line of osRelease.split('\n')) {
      if (line.startsWith('PRETTY_NAME=')) {
        distro = line.split('=')[1]?.replace(/"/g, '') || distro;
      }
      if (line.startsWith('ID=')) {
        distroId = line.split('=')[1]?.replace(/"/g, '') || distroId;
      }
    }

    const info: ServerSystemInfo = {
      distro,
      distroId,
      kernel,
      architecture: arch,
      platform,
    };

    this.store.servers.updateSystemInfo(connectionId, info);
    return info;
  }

  async getStats(connectionId: string): Promise<ServerStats> {
    const config = this.store.servers.findById(connectionId);
    if (!config) {
      throw new Error('Connection not found');
    }

    const client = await this.ssh.createSSHConnection(config);
    return this.getServerStats(client);
  }

  async getProcesses(connectionId: string): Promise<ProcessInfo[]> {
    const config = this.store.servers.findById(connectionId);
    if (!config) {
      throw new Error('Connection not found');
    }

    const client = await this.ssh.createSSHConnection(config);
    const output = await this.execCommand(
      client,
      "ps -eo pid,user,pcpu,pmem,rss,comm --no-headers --sort=-pcpu 2>/dev/null | head -n 100"
    );

    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line): ProcessInfo | null => {
        const parts = line.split(/\s+/);
        if (parts.length < 6) return null;
        const [pid, user, cpu, mem, rss, ...commandParts] = parts;
        return {
          pid: parseInt(pid, 10) || 0,
          user: user || "",
          cpuPercent: parseFloat(cpu) || 0,
          memPercent: parseFloat(mem) || 0,
          memoryMB: Math.round((parseInt(rss, 10) || 0) / 1024),
          command: commandParts.join(" "),
        };
      })
      .filter((p): p is ProcessInfo => p !== null && p.pid > 0);
  }

  private execCommand(client: Client, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      client.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        let output = "";
        stream.on("data", (data: Buffer) => {
          output += data.toString();
        });
        stream.on("close", () => resolve(output.trim()));
        stream.stderr.on("data", () => {
          // ignore stderr
        });
      });
    });
  }

  private async getServerStats(client: Client): Promise<ServerStats> {
    const [hostname, uptime, osInfo, cpuModel, cpuCores, cpuUsage, memInfo, diskInfo, loadAvg] =
      await Promise.all([
        this.execCommand(client, "hostname"),
        this.execCommand(client, "cat /proc/uptime | awk '{print $1}'"),
        this.execCommand(client, "uname -sr"),
        this.execCommand(client, "lscpu | grep 'Model name' | sed 's/Model name:\\s*//'"),
        this.execCommand(client, "nproc"),
        this.execCommand(
          client,
          "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | sed 's/%us,//'"
        ),
        this.execCommand(client, "free -m | grep Mem"),
        this.execCommand(client, "df -BG --output=source,target,size,used,avail,pcent | tail -n +2"),
        this.execCommand(client, "cat /proc/loadavg | awk '{print $1, $2, $3}'"),
      ]);

    // Parse memory
    const memParts = memInfo.split(/\s+/);
    const totalMB = parseInt(memParts[1]) || 0;
    const usedMB = parseInt(memParts[2]) || 0;
    const freeMB = parseInt(memParts[3]) || 0;

    // Parse disk
    const diskLines = diskInfo.split("\n").filter((l) => l.trim());
    const disk = diskLines.map((line) => {
      const parts = line.trim().split(/\s+/);
      return {
        filesystem: parts[0],
        mount: parts[1],
        totalGB: parseFloat(parts[2]) || 0,
        usedGB: parseFloat(parts[3]) || 0,
        freeGB: parseFloat(parts[4]) || 0,
        usagePercent: parseInt(parts[5]) || 0,
      };
    });

    // Parse load average
    const loadParts = loadAvg.split(/\s+/).map(Number);

    return {
      hostname,
      uptime: parseFloat(uptime) || 0,
      os: osInfo,
      cpu: {
        model: cpuModel || "Unknown",
        cores: parseInt(cpuCores) || 1,
        usagePercent: parseFloat(cpuUsage) || 0,
      },
      memory: {
        totalMB,
        usedMB,
        freeMB,
        usagePercent: totalMB > 0 ? Math.round((usedMB / totalMB) * 100) : 0,
      },
      disk,
      loadAverage: loadParts.length >= 3 ? loadParts : [0, 0, 0],
    };
  }
}
