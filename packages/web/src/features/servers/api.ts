import type {
  ApiResponse,
  ServerConnection,
  ServerConnectionInput,
} from "@termloop/shared";
import { request } from "@/lib/api";

export const connectionsApi = {
  list: () => request<ServerConnection[]>("/connections"),
  get: (id: string) => request<ServerConnection>(`/connections/${id}`),
  create: (data: ServerConnectionInput) =>
    request<ServerConnection>("/connections", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<ServerConnection>) =>
    request<ServerConnection>(`/connections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request(`/connections/${id}`, { method: "DELETE" }),
  test: (id: string) =>
    request(`/connections/${id}/test`, { method: "POST" }),
  testDirect: (data: ServerConnectionInput) =>
    request("/connections/test", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
