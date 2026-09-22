import { createFileRoute } from "@tanstack/react-router";
import { OverviewPage } from "@/features/servers/overview";
import { useServerConnection } from "@/features/servers";

export const Route = createFileRoute("/_serverShell/server/$id/overview")({
  component: OverviewRoute,
});

function OverviewRoute() {
  const { id } = Route.useParams();
  const connection = useServerConnection(id);
  // The parent layout (route.tsx) already guards against a missing connection — this is
  // purely for type narrowing, connection is always defined by the time this renders.
  if (!connection) return null;
  return <OverviewPage connectionId={id} connection={connection} />;
}
