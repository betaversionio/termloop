import { Monitor } from "iconsax-react";
import { PageHeader } from "@/components/shared/page-header";
import type { ServerConnection } from "@termloop/shared";
import { useConnections, useDeleteConnection, AddServerDropdown } from "@/features/servers";
import { ServerCard } from "@/features/servers";

export function ServersPage() {
  const { data, isLoading } = useConnections();
  const deleteMutation = useDeleteConnection();

  const connections = (data?.data as ServerConnection[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Servers" description="Manage your remote servers">
        <AddServerDropdown />
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-lg border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Monitor size={48} color="currentColor" variant="Linear" className="text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold">No servers yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Add your first server to start managing it through the browser.
          </p>
          <AddServerDropdown />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((conn) => (
            <ServerCard
              key={conn.id}
              connection={conn}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
