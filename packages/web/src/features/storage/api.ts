import type {
  StorageCredential,
  StorageCredentialInput,
  BucketInfo,
  BucketObjectListing,
  BucketStats,
} from "@termloop/shared";
import { request, BASE } from "@/lib/api";

const enc = encodeURIComponent;

export const storageApi = {
  list: () => request<StorageCredential[]>("/storage"),
  get: (id: string) => request<StorageCredential>(`/storage/${id}`),
  create: (data: StorageCredentialInput) =>
    request<StorageCredential>("/storage", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<StorageCredential>) =>
    request<StorageCredential>(`/storage/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request(`/storage/${id}`, { method: "DELETE" }),
  test: (id: string) =>
    request(`/storage/${id}/test`, { method: "POST" }),
  testDirect: (data: StorageCredentialInput) =>
    request("/storage/test", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Explorer APIs
  listBuckets: (credentialId: string) =>
    request<BucketInfo[]>(
      `/storage/${credentialId}/explore/buckets`
    ),
  listObjects: (
    credentialId: string,
    bucket: string,
    prefix?: string,
    token?: string
  ) =>
    request<BucketObjectListing>(
      `/storage/${credentialId}/explore/objects?bucket=${enc(bucket)}&prefix=${enc(prefix ?? "")}&token=${enc(token ?? "")}`
    ),
  getStats: (credentialId: string, bucket: string) =>
    request<BucketStats>(
      `/storage/${credentialId}/explore/stats?bucket=${enc(bucket)}`
    ),
  getDownloadUrl: (credentialId: string, bucket: string, key: string) =>
    request<string>(
      `/storage/${credentialId}/explore/download?bucket=${enc(bucket)}&key=${enc(key)}`
    ),
  getViewUrl: (credentialId: string, bucket: string, key: string) =>
    request<string>(
      `/storage/${credentialId}/explore/view?bucket=${enc(bucket)}&key=${enc(key)}`
    ),
  uploadObject: async (
    credentialId: string,
    bucket: string,
    prefix: string,
    file: File
  ) => {
    const res = await fetch(
      `http://localhost:3721${BASE}/storage/${credentialId}/explore/upload?bucket=${enc(bucket)}&prefix=${enc(prefix)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "X-File-Name": file.name,
        },
        body: file,
      }
    );
    return res.json();
  },
  deleteObject: (credentialId: string, bucket: string, key: string) =>
    request(
      `/storage/${credentialId}/explore/objects?bucket=${enc(bucket)}&key=${enc(key)}`,
      { method: "DELETE" }
    ),
  deleteFolder: (credentialId: string, bucket: string, prefix: string) =>
    request(
      `/storage/${credentialId}/explore/folder?bucket=${enc(bucket)}&prefix=${enc(prefix)}`,
      { method: "DELETE" }
    ),
  getFolderDownloadUrl: (credentialId: string, bucket: string, prefix: string) =>
    `http://localhost:3721${BASE}/storage/${credentialId}/explore/folder/download?bucket=${enc(bucket)}&prefix=${enc(prefix)}`,
};
