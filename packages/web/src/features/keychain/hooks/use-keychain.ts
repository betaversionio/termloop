import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SSHKeyInput, SSHKey } from "@termloop/shared";
import { keychainApi } from "../api";

export function useKeychain() {
  return useQuery({
    queryKey: ["keychain"],
    queryFn: () => keychainApi.list(),
  });
}

export function useCreateKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SSHKeyInput) => keychainApi.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["keychain"] }),
  });
}

export function useUpdateKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<SSHKey>;
    }) => keychainApi.update(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["keychain"] }),
  });
}

export function useDeleteKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => keychainApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["keychain"] }),
  });
}
