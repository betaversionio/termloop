import { Outlet } from "react-router-dom";
import { Sidebar, SidebarProvider } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ConnectionDialogProvider } from "@/features/servers";

export function App() {
  return (
    <SidebarProvider>
      <ConnectionDialogProvider>
        <div className="fixed inset-0 flex bg-background md:bg-sidebar">
          <Sidebar />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:mt-3 md:rounded-tl-2xl md:border-l md:border-t md:border-border">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </ConnectionDialogProvider>
    </SidebarProvider>
  );
}
