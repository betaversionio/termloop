import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
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
import { StorageSidebar } from "@/features/storage/components/storage-sidebar";
import { useStorageCredential } from "@/features/storage";

export const Route = createFileRoute("/_storageShell")({
  component: StorageShell,
});

function StorageHeader() {
  const { id } = useParams({ strict: false });
  const credential = useStorageCredential(id ?? "");

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

function StorageShell() {
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
