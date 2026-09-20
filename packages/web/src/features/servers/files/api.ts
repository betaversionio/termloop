import type { ApiResponse, RemoteFile } from "@termloop/shared";
import { request, BASE } from "@/lib/api";

export const sftpApi = {
  list: (connectionId: string, path: string) =>
    request<RemoteFile[]>(
      `/sftp/${connectionId}/list?path=${encodeURIComponent(path)}`
    ),
  download: (connectionId: string, path: string) =>
    `${BASE}/sftp/${connectionId}/download?path=${encodeURIComponent(path)}`,
  downloadFolder: (connectionId: string, path: string) =>
    `${BASE}/sftp/${connectionId}/download-folder?path=${encodeURIComponent(path)}`,
  upload: async (connectionId: string, dirPath: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(
      `${BASE}/sftp/${connectionId}/upload?path=${encodeURIComponent(dirPath)}`,
      { method: "POST", body: formData }
    );
    return res.json() as Promise<ApiResponse>;
  },
  delete: (connectionId: string, path: string, isDir: boolean) =>
    request(
      `/sftp/${connectionId}/delete?path=${encodeURIComponent(path)}&isDir=${isDir}`,
      { method: "DELETE" }
    ),
  rename: (connectionId: string, oldPath: string, newPath: string) =>
    request(`/sftp/${connectionId}/rename`, {
      method: "POST",
      body: JSON.stringify({ oldPath, newPath }),
    }),
  mkdir: (connectionId: string, path: string) =>
    request(`/sftp/${connectionId}/mkdir`, {
      method: "POST",
      body: JSON.stringify({ path }),
    }),
  read: (connectionId: string, path: string) =>
    request<{ content: string }>(
      `/sftp/${connectionId}/read?path=${encodeURIComponent(path)}`
    ),
  write: (connectionId: string, path: string, content: string) =>
    request(`/sftp/${connectionId}/write`, {
      method: "POST",
      body: JSON.stringify({ path, content }),
    }),
};
