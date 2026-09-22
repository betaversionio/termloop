import type { ServerConnection } from "@termloop/shared";
import { useConnections } from "./use-connections";

export function useServerConnection(id: string): ServerConnection | undefined {
  const { data } = useConnections();
  const connections = (data?.data as ServerConnection[] | undefined) ?? [];
  return connections.find((c) => c.id === id);
}
