import type { ReactNode } from "react";
import { HambergerMenu, SidebarLeft } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/sidebar/sidebar-context";
import { HeaderActions } from "@/components/layout/header-actions";
import { ServerTabBar } from "@/features/servers/components/server-tab-bar";

export function PageHeader({ children }: { children?: ReactNode }) {
  const { collapsed, toggle, setMobileOpen } = useSidebar();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="hidden h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground md:flex"
          onClick={toggle}
          aria-label="Toggle sidebar"
        >
          <SidebarLeft
            size={18}
            color="currentColor"
            className={cn("transition-transform", collapsed && "rotate-180")}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <HambergerMenu size={20} color="currentColor" />
        </Button>
        <ServerTabBar />
        {children}
      </div>
      <HeaderActions />
    </header>
  );
}
