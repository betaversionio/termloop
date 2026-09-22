import { createFileRoute } from "@tanstack/react-router";
import { MonitorPage } from "@/features/servers/monitor";

export const Route = createFileRoute("/_serverShell/server/$id/monitor")({
  component: MonitorRoute,
});

function MonitorRoute() {
  const { id } = Route.useParams();
  return <MonitorPage connectionId={id} />;
}
