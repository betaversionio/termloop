import { useParams, useLocation } from "@tanstack/react-router";
import { Category, Setting2, Bucket, type Icon } from "iconsax-react";
import { cn } from "@/lib/utils";
import { SidebarShell } from "@/components/ui/sidebar";
import { SidebarHeader } from "@/components/layout/sidebar/sidebar-header";
import { SidebarNavGroup } from "@/components/layout/sidebar/sidebar-nav-group";
import { SidebarNavLink } from "@/components/layout/sidebar/sidebar-nav-link";
import { useSidebar } from "@/components/layout/sidebar/sidebar-context";
import { useStorageBucketList } from "@/features/storage/hooks/use-storage-explorer";
import { Skeleton } from "@/components/ui/skeleton";

interface TabItem {
  icon: Icon;
  label: string;
  value: string;
}

const tabs: TabItem[] = [
  { icon: Category, label: "Overview", value: "overview" },
  { icon: Setting2, label: "Settings", value: "settings" },
];

export function StorageSidebar() {
  const { collapsed } = useSidebar();
  const { id } = useParams({ strict: false });
  const pathname = useLocation({ select: (l) => l.pathname });

  const { data: bucketsData, isLoading: bucketsLoading } = useStorageBucketList(id!);
  const buckets = bucketsData?.data ?? [];

  const segments = pathname.split("/");
  const afterId = segments[3] ?? "overview";
  const activeTab = afterId === "b" ? null : afterId;
  const activeBucket =
    afterId === "b" ? decodeURIComponent(segments[4] ?? "") : null;

  return (
    <SidebarShell>
      <SidebarHeader />

      <nav
        className={cn(
          "scrollbar-none flex-1 overflow-y-auto px-2 py-4",
          collapsed ? "space-y-0.5" : "space-y-4",
        )}
      >
        <SidebarNavGroup>
          {tabs.map((item) => (
            <SidebarNavLink
              key={item.value}
              to={`/storage/${id}/${item.value}`}
              icon={item.icon}
              label={item.label}
              isActive={activeTab === item.value}
            />
          ))}
        </SidebarNavGroup>

        <SidebarNavGroup title="Buckets">
          {bucketsLoading ? (
            !collapsed && (
              <div className="space-y-1 px-3">
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
              </div>
            )
          ) : buckets.length === 0 ? (
            !collapsed && (
              <p className="px-3 text-xs text-muted-foreground">
                No buckets found
              </p>
            )
          ) : (
            buckets.map((b) => (
              <SidebarNavLink
                key={b.name}
                to={`/storage/${id}/b/${encodeURIComponent(b.name)}`}
                icon={Bucket}
                label={b.name}
                isActive={activeBucket === b.name}
                size="sm"
              />
            ))
          )}
        </SidebarNavGroup>
      </nav>
    </SidebarShell>
  );
}
