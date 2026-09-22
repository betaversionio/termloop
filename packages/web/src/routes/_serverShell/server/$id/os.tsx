import { createFileRoute } from "@tanstack/react-router";
import { OsPage } from "@/features/servers/os";

export const Route = createFileRoute("/_serverShell/server/$id/os")({
  component: OsRoute,
});

function OsRoute() {
  const { id } = Route.useParams();
  return <OsPage connectionId={id} />;
}
