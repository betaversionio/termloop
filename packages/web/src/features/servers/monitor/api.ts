import type { ServerStats, ServerSystemInfo } from "@termloop/shared";
import { request } from "@/lib/api";

export const statsApi = {
  get: (connectionId: string) =>
    request<ServerStats>(`/stats/${connectionId}`),
  getSystemInfo: (connectionId: string) =>
    request<ServerSystemInfo>(`/stats/${connectionId}/system-info`),
  refreshSystemInfo: (connectionId: string) =>
    request<ServerSystemInfo>(`/stats/${connectionId}/system-info?refresh=true`),
};
