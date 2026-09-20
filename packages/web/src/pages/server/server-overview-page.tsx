import { Outlet, useParams, useOutletContext } from "react-router-dom";
import type { ServerConnection } from "@termloop/shared";
import { useConnections } from "@/features/servers";

interface ServerContext {
  connectionId: string;
  connection: ServerConnection;
}

export function useServerContext() {
  return useOutletContext<ServerContext>();
}

export function ServerPage() {
  const { id } = useParams<{ id: string }>();

  const { data } = useConnections();
  const connections = (data?.data as ServerConnection[] | undefined) ?? [];
  const connection = connections.find((c) => c.id === id);

  if (!connection) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Server not found
      </div>
    );
  }

  return <Outlet context={{ connectionId: id!, connection }} />;
}
