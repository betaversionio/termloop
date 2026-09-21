import { Link, Outlet, useParams } from "react-router-dom";
import { SidebarProvider } from "@/components/layout/sidebar/sidebar-context";
import { PageHeader } from "@/components/ui/page-header";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useStorage } from "@/features/storage/hooks/use-storage";
import type { StorageCredential } from "@termloop/shared";
import { StorageSidebar } from "@/features/storage/components/storage-sidebar";

function StorageHeader() {
  const { id } = useParams<{ id: string }>();

  const { data } = useStorage();
  const credentials = (data?.data as StorageCredential[] | undefined) ?? [];
  const credential = credentials.find((c) => c.id === id);

  return (
    <PageHeader>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/storage">Storage</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {credential && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{credential.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </PageHeader>
  );
}

export function StorageLayout() {
  return (
    <SidebarProvider>
      <div className="fixed inset-0 flex bg-background md:bg-sidebar">
        <StorageSidebar />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:mt-3 md:rounded-tl-2xl md:border-l md:border-t md:border-border">
          <StorageHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
