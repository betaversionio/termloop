import { useState } from "react";
import { Monitor, Grid2, RowVertical } from "iconsax-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import type { ServerConnection } from "@termloop/shared";
import {
  useConnections,
  useDeleteConnection,
  AddServerDropdown,
  ServerCard,
  ServerListRow,
} from "@/features/servers";

const VIEW_MODE_KEY = "termloop-servers-view-mode";

type ViewMode = "grid" | "list";

function loadViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem(VIEW_MODE_KEY);
    if (stored === "grid" || stored === "list") return stored;
  } catch {}
  return "grid";
}

export function ServersPage() {
  const { data, isLoading } = useConnections();
  const deleteMutation = useDeleteConnection();
  const [viewMode, setViewMode] = useState<ViewMode>(loadViewMode);

  const connections = (data?.data as ServerConnection[] | undefined) ?? [];

  const setMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Servers" description="Manage your remote servers">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border p-0.5">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setMode("grid")}
              aria-label="Grid view"
            >
              <Grid2 size={16} color="currentColor" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setMode("list")}
              aria-label="List view"
            >
              <RowVertical size={16} color="currentColor" />
            </Button>
          </div>
          <AddServerDropdown />
        </div>
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
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((conn) => (
            <ServerCard
              key={conn.id}
              connection={conn}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {connections.map((conn) => (
            <ServerListRow
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
