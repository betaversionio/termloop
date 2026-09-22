import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

const COLLAPSED_KEY = "termloop-sidebar-collapsed";

function loadCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function saveCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {}
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Backed by localStorage (not just this provider's own state) so the collapsed/expanded
  // state stays in sync across the app's separate top-level layouts (Dashboard, Server,
  // Storage each mount their own SidebarProvider) and survives a page reload.
  const [collapsed, setCollapsedState] = useState(loadCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    saveCollapsed(v);
  };

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        toggle: () => setCollapsed(!collapsed),
        mobileOpen,
        setMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
