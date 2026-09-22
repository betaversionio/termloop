import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/pages/projects";

export const Route = createFileRoute("/_appShell/projects")({
  component: ProjectsPage,
});
