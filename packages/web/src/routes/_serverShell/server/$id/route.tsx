import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useServerConnection } from "@/features/servers";

export const Route = createFileRoute("/_serverShell/server/$id")({
  component: ServerDetailLayout,
});

function ServerDetailLayout() {
  const { id } = Route.useParams();
  const connection = useServerConnection(id);

  if (!connection) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Server not found
      </div>
    );
  }

  return <Outlet />;
}
