import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { statsApi } from "../api";

export function useProcesses(connectionId: string) {
  return useQuery({
    queryKey: ["processes", connectionId],
    queryFn: () => statsApi.getProcesses(connectionId),
    refetchInterval: 3000,
  });
}

export function useKillProcess(connectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pid: number) => statsApi.killProcess(connectionId, pid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes", connectionId] });
    },
  });
}
