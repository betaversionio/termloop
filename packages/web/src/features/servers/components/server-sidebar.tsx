import { useParams, useLocation } from "@tanstack/react-router";
import { Category, CommandSquare, FolderOpen, Activity, Setting2, Monitor, type Icon } from "iconsax-react";
import { cn } from "@/lib/utils";
import { SidebarShell } from "@/components/ui/sidebar";
import { SidebarHeader } from "@/components/layout/sidebar/sidebar-header";
import { SidebarNavLink } from "@/components/layout/sidebar/sidebar-nav-link";
import { useSidebar } from "@/components/layout/sidebar/sidebar-context";

interface TabItem {
  icon: Icon;
  label: string;
  value: string;
}

const tabs: TabItem[] = [
  { icon: Category, label: "Overview", value: "overview" },
  { icon: CommandSquare, label: "Terminal", value: "terminal" },
  { icon: FolderOpen, label: "Files", value: "files" },
  { icon: Activity, label: "Monitor", value: "monitor" },
  { icon: Monitor, label: "OS", value: "os" },
  { icon: Setting2, label: "Settings", value: "settings" },
];

export function ServerSidebar() {
  const { collapsed } = useSidebar();
  const { id } = useParams({ strict: false });
  const pathname = useLocation({ select: (l) => l.pathname });

  const activeTab = pathname.split("/").pop() ?? "terminal";

  return (
    <SidebarShell>
      <SidebarHeader />

      <nav
        className={cn(
          "scrollbar-none flex-1 overflow-y-auto px-2 py-4",
          collapsed ? "space-y-0.5" : "space-y-1"
        )}
      >
        {tabs.map((item) => (
          <SidebarNavLink
            key={item.value}
            to={`/server/${id}/${item.value}`}
            icon={item.icon}
            label={item.label}
            isActive={activeTab === item.value}
          />
        ))}
      </nav>
    </SidebarShell>
  );
}
