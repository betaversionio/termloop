'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  SidebarContext,
  useSidebar,
} from '@/components/layout/sidebar/sidebar-context';

interface SidebarShellProps {
  children: ReactNode;
}

export function SidebarShell({ children }: SidebarShellProps) {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <TooltipProvider>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'bg-sidebar hidden h-full flex-col pt-4 transition-all duration-300 md:flex',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {children}
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 [&>button:last-child]:hidden"
        >
          <SidebarContext.Provider
            value={{
              collapsed: false,
              setCollapsed: () => {},
              toggle: () => {},
              mobileOpen,
              setMobileOpen,
            }}
          >
            <aside className="bg-sidebar flex h-full flex-col pt-3">
              {children}
            </aside>
          </SidebarContext.Provider>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
