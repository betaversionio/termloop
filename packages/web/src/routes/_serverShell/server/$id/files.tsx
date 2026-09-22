import { createFileRoute } from "@tanstack/react-router";
import { FilesPage } from "@/features/servers/files";

export const Route = createFileRoute("/_serverShell/server/$id/files")({
  component: FilesRoute,
});

function FilesRoute() {
  const { id } = Route.useParams();
  return <FilesPage connectionId={id} />;
}
