import { createFileRoute } from "@tanstack/react-router";
import { ServerSettingsPage } from "@/pages/server/server-settings-page";
import { useServerConnection } from "@/features/servers";

export const Route = createFileRoute("/_serverShell/server/$id/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  const { id } = Route.useParams();
  const connection = useServerConnection(id);
  if (!connection) return null;
  return <ServerSettingsPage connection={connection} />;
}
