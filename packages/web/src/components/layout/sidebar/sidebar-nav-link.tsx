import { Link } from "@tanstack/react-router";
import type { Icon } from "iconsax-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "./sidebar-context";

interface SidebarNavLinkProps {
  to: string;
  icon: Icon;
  label: string;
  isActive: boolean;
  size?: "default" | "sm";
  /** Open in a new browser tab instead of navigating the current one (e.g. the OS view, which takes over the whole viewport and would otherwise block the rest of the UI). */
  newTab?: boolean;
}

export function SidebarNavLink({
  to,
  icon: IconComp,
  label,
  isActive,
  size = "default",
  newTab = false,
}: SidebarNavLinkProps) {
  const { collapsed, setMobileOpen } = useSidebar();

  const link = (
    <Link
      to={to}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      onClick={() => setMobileOpen(false)}
      className={cn(
        "flex w-full items-center rounded-md text-sm font-normal transition-colors",
        isActive
          ? "bg-[hsl(210,10%,89%)] dark:bg-accent/80 shadow-glass"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        size === "sm" ? "gap-2.5 py-1.5" : "py-2",
      )}
    >
      <IconComp
        size={collapsed ? 22 : size === "sm" ? 16 : 20}
        color="currentColor"
        variant={isActive ? "Bulk" : "Linear"}
        className="shrink-0"
      />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
