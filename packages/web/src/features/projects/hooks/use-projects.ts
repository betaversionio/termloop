import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectInput, Project } from "@termloop/shared";
import { projectsApi } from "../api";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list(),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => projectsApi.get(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectInput) => projectsApi.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectsApi.update(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}
