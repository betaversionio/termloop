export interface ServerStats {
  hostname: string;
  uptime: number;
  os: string;
  cpu: CpuStats;
  memory: MemoryStats;
  disk: DiskStats[];
  loadAverage: number[];
}

export interface CpuStats {
  model: string;
  cores: number;
  usagePercent: number;
}

export interface MemoryStats {
  totalMB: number;
  usedMB: number;
  freeMB: number;
  usagePercent: number;
}

export interface DiskStats {
  filesystem: string;
  mount: string;
  totalGB: number;
  usedGB: number;
  freeGB: number;
  usagePercent: number;
}

export interface ProcessInfo {
  pid: number;
  user: string;
  cpuPercent: number;
  memPercent: number;
  memoryMB: number;
  command: string;
}
