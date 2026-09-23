import { useMemo } from "react";
import { useMarketplace } from "@/features/servers/marketplace/components/marketplace-context";
import { useDesktopSettings } from "../context/desktop-settings-context";
import { appRegistry } from "../lib/os-constants";
import type { AppType } from "../types/window";

/** The Dock's effective pinned app list — the default (install-order) list with the
 * user's saved reorder/pin/unpin applied on top. Shared by the Dock itself and by
 * anything that needs to know "is this app pinned to the Dock" (e.g. desktop icons'
 * context menu offering "Keep in Dock"). */
export function useDockApps(): AppType[] {
  const { dockApps: defaultDockApps } = useMarketplace();
  const { dockOrder, hiddenDockApps } = useDesktopSettings();

  return useMemo<AppType[]>(() => {
    const visible = dockOrder
      ? (() => {
          // Validate against the full app registry, not just defaultDockApps —
          // dockOrder is authoritative for anything the user has explicitly pinned
          // or reordered, including a marketplace app (e.g. a game) that isn't one
          // of the "shown in dock by default" apps. Restricting to defaultDockApps
          // here silently dropped a freshly-pinned non-default app on every render.
          const ordered = dockOrder.filter((t): t is AppType => appRegistry.has(t as AppType));
          const missing = defaultDockApps.filter((t) => !ordered.includes(t));
          return [...ordered, ...missing];
        })()
      : defaultDockApps;
    return visible.filter((t) => !hiddenDockApps.includes(t));
  }, [defaultDockApps, dockOrder, hiddenDockApps]);
}
