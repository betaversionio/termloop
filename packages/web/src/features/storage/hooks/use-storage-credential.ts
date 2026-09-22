import type { StorageCredential } from "@termloop/shared";
import { useStorage } from "./use-storage";

export function useStorageCredential(id: string): StorageCredential | undefined {
  const { data } = useStorage();
  const credentials = (data?.data as StorageCredential[] | undefined) ?? [];
  return credentials.find((c) => c.id === id);
}
