import { createFileRoute } from "@tanstack/react-router";
import { ProjectPage } from "@/pages/project";

export const Route = createFileRoute("/_appShell/project/$id")({
  component: ProjectPage,
});
