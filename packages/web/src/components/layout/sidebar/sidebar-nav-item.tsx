import { useLocation } from "@tanstack/react-router";
import type { NavItem } from "./sidebar-config";
import { SidebarNavLink } from "./sidebar-nav-link";

interface SidebarNavItemProps {
  item: NavItem;
}

export function SidebarNavItem({ item }: SidebarNavItemProps) {
  const pathname = useLocation({ select: (l) => l.pathname });
  const isExactMatch = pathname === item.href;
  const isChildRoute =
    item.href !== "/" && pathname.startsWith(`${item.href}/`);
  const isActive = isExactMatch || isChildRoute;

  return (
    <SidebarNavLink
      to={item.href}
      icon={item.icon}
      label={item.label}
      isActive={isActive}
    />
  );
}
