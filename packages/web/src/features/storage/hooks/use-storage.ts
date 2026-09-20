import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StorageCredentialInput, StorageCredential } from "@termloop/shared";
import { storageApi } from "../api";

export function useStorage() {
  return useQuery({
    queryKey: ["storage"],
    queryFn: () => storageApi.list(),
  });
}

export function useCreateStorage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StorageCredentialInput) => storageApi.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["storage"] }),
  });
}

export function useUpdateStorage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<StorageCredential>;
    }) => storageApi.update(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["storage"] }),
  });
}

export function useDeleteStorage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storageApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["storage"] }),
  });
}

export function useTestStorageCredential() {
  return useMutation({
    mutationFn: (id: string) => storageApi.test(id),
  });
}

export function useTestStorageDirect() {
  return useMutation({
    mutationFn: (data: StorageCredentialInput) => storageApi.testDirect(data),
  });
}
