import { useEffect } from "react";
import { createFileRoute, Outlet, useLocation, useParams } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/layout/sidebar/sidebar-context";
import { ConnectionDialogProvider } from "@/features/servers";
import { PageHeader } from "@/components/ui/page-header";
import { ServerSidebar } from "@/features/servers/components/server-sidebar";
import { openTab } from "@/features/servers/components/server-tabs-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_serverShell")({
  component: ServerShell,
});

function ServerShellContent() {
  // strict: false — this layout wraps /server/$id/* but doesn't itself have $id in its
  // own path, so it reads whatever the currently matched child route resolved.
  const { id } = useParams({ strict: false });
  const pathname = useLocation({ select: (l) => l.pathname });
  const isTerminalActive = pathname.endsWith("/terminal");

  // Track every server the user navigates to this session as an open tab.
  useEffect(() => {
    if (id) openTab(id);
  }, [id]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:mt-3 md:rounded-tl-2xl md:border-l md:border-t md:border-border">
      <PageHeader />
      <main className={cn("flex-1 overflow-y-auto", !isTerminalActive && "p-6")}>
        <Outlet />
      </main>
    </div>
  );
}

function ServerShell() {
  return (
    <ConnectionDialogProvider>
      <SidebarProvider>
        <div className="fixed inset-0 flex bg-background md:bg-sidebar">
          <ServerSidebar />
          <ServerShellContent />
        </div>
      </SidebarProvider>
    </ConnectionDialogProvider>
  );
}
