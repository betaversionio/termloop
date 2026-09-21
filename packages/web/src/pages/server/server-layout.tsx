import { useEffect } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { Home2 } from 'iconsax-react';
import { SidebarProvider } from '@/components/layout/sidebar/sidebar-context';
import { ConnectionDialogProvider } from '@/features/servers';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ServerSidebar } from '@/features/servers/components/server-sidebar';
import { openTab } from '@/features/servers/components/server-tabs-context';
import { ServerTabBar } from '@/features/servers/components/server-tab-bar';

function ServerHeader() {
  return (
    <PageHeader>
      <div className="flex min-w-0 items-center gap-1.5">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link to="/" aria-label="Home">
                <Home2 size={16} color="currentColor" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Home</TooltipContent>
        </Tooltip>
        <ServerTabBar />
      </div>
    </PageHeader>
  );
}

function ServerLayoutContent() {
  const { id } = useParams<{ id: string }>();

  // Track every server the user navigates to this session as an open tab.
  useEffect(() => {
    if (id) openTab(id);
  }, [id]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:mt-3 md:rounded-tl-2xl md:border-l md:border-t md:border-border">
      <ServerHeader />
      <main className="flex-1 overflow-y-auto p-6">
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
