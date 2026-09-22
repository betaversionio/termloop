import { useEffect } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { SidebarProvider } from '@/components/layout/sidebar/sidebar-context';
import { ConnectionDialogProvider } from '@/features/servers';
import { PageHeader } from '@/components/ui/page-header';
import { ServerSidebar } from '@/features/servers/components/server-sidebar';
import { openTab } from '@/features/servers/components/server-tabs-context';
import { cn } from '@/lib/utils';

function ServerLayoutContent() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isTerminalActive = location.pathname.endsWith('/terminal');

  // Track every server the user navigates to this session as an open tab.
  useEffect(() => {
    if (id) openTab(id);
  }, [id]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:mt-3 md:rounded-tl-2xl md:border-l md:border-t md:border-border">
      <PageHeader />
      <main className={cn('flex-1 overflow-y-auto', !isTerminalActive && 'p-6')}>
        <Outlet />
      </main>
    </div>
  );
}

export function ServerLayout() {
  return (
    <ConnectionDialogProvider>
      <SidebarProvider>
        <div className="fixed inset-0 flex bg-background md:bg-sidebar">
          <ServerSidebar />
          <ServerLayoutContent />
        </div>
      </SidebarProvider>
    </ConnectionDialogProvider>
  );
}
