import { useMemo } from "react";
import { useMarketplace } from "@/features/servers/marketplace/components/marketplace-context";
import { useDesktopSettings } from "../context/desktop-settings-context";
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
          const known = new Set(defaultDockApps);
          const ordered = dockOrder.filter((t): t is AppType => known.has(t as AppType));
          const missing = defaultDockApps.filter((t) => !ordered.includes(t));
          return [...ordered, ...missing];
        })()
      : defaultDockApps;
    return visible.filter((t) => !hiddenDockApps.includes(t));
  }, [defaultDockApps, dockOrder, hiddenDockApps]);
}
