import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServerConnectionInput, ServerConnection } from "@termloop/shared";
import { connectionsApi } from "../api";

export function useConnections() {
  return useQuery({
    queryKey: ["connections"],
    queryFn: () => connectionsApi.list(),
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ServerConnectionInput) => connectionsApi.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["connections"] }),
  });
}

export function useUpdateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ServerConnection>;
    }) => connectionsApi.update(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["connections"] }),
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => connectionsApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["connections"] }),
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: (id: string) => connectionsApi.test(id),
  });
}

export function useTestConnectionDirect() {
  return useMutation({
    mutationFn: (data: ServerConnectionInput) => connectionsApi.testDirect(data),
  });
}
