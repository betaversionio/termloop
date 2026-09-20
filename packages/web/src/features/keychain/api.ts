import type { ApiResponse, SSHKey, SSHKeyInput } from "@termloop/shared";
import { request } from "@/lib/api";

export const keychainApi = {
  list: () => request<SSHKey[]>("/keychain"),
  get: (id: string) => request<SSHKey>(`/keychain/${id}`),
  create: (data: SSHKeyInput) =>
    request<SSHKey>("/keychain", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<SSHKey>) =>
    request<SSHKey>(`/keychain/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request(`/keychain/${id}`, { method: "DELETE" }),
};
