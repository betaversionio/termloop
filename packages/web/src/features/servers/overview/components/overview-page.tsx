import { useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Cpu,
  Ram,
  Driver,
  Clock,
  CommandSquare,
  FolderOpen,
  Activity,
  Monitor,
  RefreshCircle,
  Global,
  Hierarchy,
  Layer,
} from "iconsax-react";
import type { ServerStats, ServerSystemInfo, ServerConnection } from "@termloop/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatUptime } from "@/lib/utils";
import { useStats, useSystemInfo, StatCard } from "@/features/servers/monitor";
import { statsApi } from "@/features/servers/monitor/api";

interface OverviewPageProps {
  connectionId: string;
  connection: ServerConnection;
}

function StatusBadge({ status }: { status: "connected" | "connecting" | "disconnected" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "connected" && "bg-emerald-500/10 text-emerald-500",
        status === "connecting" && "bg-amber-500/10 text-amber-500",
        status === "disconnected" && "bg-destructive/10 text-destructive"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "connected" && "bg-emerald-500",
          status === "connecting" && "bg-amber-500 animate-pulse",
          status === "disconnected" && "bg-destructive"
        )}
      />
      {status === "connected" ? "Connected" : status === "connecting" ? "Connecting..." : "Disconnected"}
    </span>
  );
}

function SystemInfoCard({
  info,
  isLoading,
  onRefresh,
  isRefreshing,
}: {
  info?: ServerSystemInfo;
  isLoading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!info) return null;

  const fields = [
    { icon: Monitor, label: "OS", value: info.distro },
    { icon: Hierarchy, label: "Kernel", value: info.kernel },
    { icon: Layer, label: "Architecture", value: info.architecture },
    { icon: Global, label: "Platform", value: info.platform },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">System Information</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-7 px-2 text-xs"
        >
          <RefreshCircle
            size={14}
            color="currentColor"
            className={cn("mr-1", isRefreshing && "animate-spin")}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.label} className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <f.icon size={12} color="currentColor" />
              <span>{f.label}</span>
            </div>
            <p className="text-sm font-medium truncate" title={f.value}>
              {f.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();

  const actions = [
    { icon: CommandSquare, label: "Terminal", path: "terminal" },
    { icon: FolderOpen, label: "Files", path: "files" },
    { icon: Activity, label: "Monitor", path: "monitor" },
    { icon: Monitor, label: "OS", path: "os", newTab: true },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {actions.map((a) => (
          <Button
            key={a.path}
            variant="outline"
            className="h-auto flex-col gap-2 py-3"
            onClick={() =>
              a.newTab
                ? window.open(`/server/${id}/${a.path}`, "_blank", "noopener,noreferrer")
                : navigate({ to: `/server/${id}/${a.path}` })
            }
          >
            <a.icon size={20} color="currentColor" variant="Bulk" />
            <span className="text-xs">{a.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export function OverviewPage({ connectionId, connection }: OverviewPageProps) {
  const { data: statsData, isLoading: statsLoading } = useStats(connectionId);
  const { data: sysData, isLoading: sysLoading } = useSystemInfo(connectionId);
  const queryClient = useQueryClient();

  const stats = statsData?.data as ServerStats | undefined;
  const systemInfo = sysData?.data as ServerSystemInfo | undefined;

  const isRefreshing = false;

  const handleRefreshSystemInfo = async () => {
    await statsApi.refreshSystemInfo(connectionId);
    queryClient.invalidateQueries({ queryKey: ["system-info", connectionId] });
  };

  return (
    <div className="space-y-4">
      {/* Connection Header */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connection.color && (
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: connection.color }}
              />
            )}
            <div>
              <h2 className="text-lg font-semibold">{connection.name}</h2>
              <p className="text-sm text-muted-foreground">
                {connection.username}@{connection.host}:{connection.port}
              </p>
            </div>
          </div>
          <StatusBadge status={statsLoading ? "connecting" : stats ? "connected" : "disconnected"} />
        </div>
      </div>

      {/* System Info */}
      <SystemInfoCard
        info={systemInfo}
        isLoading={sysLoading}
        onRefresh={handleRefreshSystemInfo}
        isRefreshing={isRefreshing}
      />

      {/* Live Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-7 w-14" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            title="CPU"
            icon={<Cpu size={18} color="currentColor" variant="Bulk" />}
            value={`${stats.cpu.usagePercent.toFixed(1)}%`}
            percentage={stats.cpu.usagePercent}
            details={[
              { label: "Model", value: stats.cpu.model },
              { label: "Cores", value: String(stats.cpu.cores) },
              {
                label: "Load Avg",
                value: stats.loadAverage.map((l) => l.toFixed(2)).join(", "),
              },
            ]}
          />
          <StatCard
            title="Memory"
            icon={<Ram size={18} color="currentColor" variant="Bulk" />}
            value={`${stats.memory.usagePercent}%`}
            percentage={stats.memory.usagePercent}
            details={[
              { label: "Total", value: `${stats.memory.totalMB} MB` },
              { label: "Used", value: `${stats.memory.usedMB} MB` },
              { label: "Free", value: `${stats.memory.freeMB} MB` },
            ]}
          />
          {stats.disk.slice(0, 2).map((d, i) => (
            <StatCard
              key={i}
              title={`Disk ${d.mount}`}
              icon={<Driver size={18} color="currentColor" variant="Bulk" />}
              value={`${d.usagePercent}%`}
              percentage={d.usagePercent}
              details={[
                { label: "Total", value: `${d.totalGB} GB` },
                { label: "Used", value: `${d.usedGB} GB` },
                { label: "Free", value: `${d.freeGB} GB` },
              ]}
            />
          ))}
        </div>
      ) : null}

      {/* Uptime */}
      {stats && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} color="currentColor" variant="Bulk" className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">Uptime</h3>
          </div>
          <p className="text-2xl font-bold">{formatUptime(stats.uptime)}</p>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
