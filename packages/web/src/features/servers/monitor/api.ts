import type { ServerStats, ServerSystemInfo, ProcessInfo } from "@termloop/shared";
import { request } from "@/lib/api";

export const statsApi = {
  get: (connectionId: string) =>
    request<ServerStats>(`/stats/${connectionId}`),
  getSystemInfo: (connectionId: string) =>
    request<ServerSystemInfo>(`/stats/${connectionId}/system-info`),
  refreshSystemInfo: (connectionId: string) =>
    request<ServerSystemInfo>(`/stats/${connectionId}/system-info?refresh=true`),
  getProcesses: (connectionId: string) =>
    request<ProcessInfo[]>(`/stats/${connectionId}/processes`),
  killProcess: (connectionId: string, pid: number) =>
    request<{ stdout: string; stderr: string; code: number }>(`/ssh/${connectionId}/exec`, {
      method: "POST",
      body: JSON.stringify({ command: `kill -9 ${pid}` }),
    }),
};
