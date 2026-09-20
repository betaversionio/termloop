import { Cpu, Driver, Ram, Clock, RefreshCircle } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUptime } from "@/lib/utils";
import type { ServerStats } from "@termloop/shared";
import { useStats } from "../hooks/use-stats";
import { StatCard } from "./stat-card";

interface MonitorPageProps {
  connectionId: string;
}

export function MonitorPage({ connectionId }: MonitorPageProps) {
  const { data, isLoading, refetch } = useStats(connectionId);

  const stats = data?.data as ServerStats | undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
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
              <div className="space-y-1">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>Failed to load server stats</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          <RefreshCircle size={14} color="currentColor" className="mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {stats.hostname} - {stats.os}
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCircle size={14} color="currentColor" className="mr-1.5" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPU */}
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

        {/* Memory */}
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

        {/* Disk */}
        {stats.disk.map((d, i) => (
          <StatCard
            key={i}
            title={`Disk ${d.mount}`}
            icon={<Driver size={18} color="currentColor" variant="Bulk" />}
            value={`${d.usagePercent}%`}
            percentage={d.usagePercent}
            details={[
              { label: "Filesystem", value: d.filesystem },
              { label: "Total", value: `${d.totalGB} GB` },
              { label: "Used", value: `${d.usedGB} GB` },
              { label: "Free", value: `${d.freeGB} GB` },
            ]}
          />
        ))}

        {/* Uptime */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} color="currentColor" variant="Bulk" className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">Uptime</h3>
          </div>
          <p className="text-2xl font-bold">{formatUptime(stats.uptime)}</p>
        </div>
      </div>
    </div>
  );
}
