import { useState, useCallback } from "react";
import { FolderOpen, Add } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import type { Project } from "@termloop/shared";
import { ProjectCard, ProjectDialog, useProjects, useDeleteProject } from "@/features/projects";

export function DashboardPage() {
  const { data, isLoading } = useProjects();
  const deleteMutation = useDeleteProject();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | undefined>();

  const projects = (data?.data as Project[] | undefined) ?? [];

  const openAdd = useCallback(() => {
    setEditProject(undefined);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((project: Project) => {
    setEditProject(project);
    setDialogOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setDialogOpen(false);
    setEditProject(undefined);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Manage your projects">
        <Button onClick={openAdd}>
          <Add size={18} color="currentColor" />
          New Project
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-lg border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen size={48} color="currentColor" variant="Linear" className="text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold">No projects yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Create a project to organize your servers and buckets together.
          </p>
          <Button onClick={openAdd}>
            <Add size={18} color="currentColor" />
            New Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={openEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onClose={handleClose}
        editProject={editProject}
      />
    </div>
  );
}
