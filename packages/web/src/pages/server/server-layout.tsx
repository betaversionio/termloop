import { Link, Outlet, useParams } from 'react-router-dom';
import { SidebarProvider } from '@/components/layout/sidebar/sidebar-context';
import { ConnectionDialogProvider } from '@/features/servers';
import { PageHeader } from '@/components/ui/page-header';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useConnections } from '@/features/servers';
import type { ServerConnection } from '@termloop/shared';
import { ServerSidebar } from '@/features/servers/components/server-sidebar';

function ServerHeader() {
  const { id } = useParams<{ id: string }>();

  const { data } = useConnections();
  const connections = (data?.data as ServerConnection[] | undefined) ?? [];
  const connection = connections.find((c) => c.id === id);

  return (
    <PageHeader>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/servers">Servers</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {connection && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{connection.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </PageHeader>
  );
}

export function ServerLayout() {
  return (
    <ConnectionDialogProvider>
      <SidebarProvider>
        <div className="fixed inset-0 flex bg-background">
          <ServerSidebar />
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <ServerHeader />
            <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ConnectionDialogProvider>
  );
}
