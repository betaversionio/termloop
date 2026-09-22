import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface IconPosition {
  x: number;
  y: number;
}

export type WidgetSize = "small" | "medium" | "large";

export interface PlacedWidget {
  /** Unique per placed instance — distinct from `widgetId`, since the same widget
   * can be placed on the desktop more than once (e.g. two Clocks for two timezones). */
  instanceId: string;
  widgetId: string;
  size: WidgetSize;
  position: IconPosition;
}

interface DesktopSettingsContext {
  wallpaper: string;
  setWallpaper: (id: string) => void;
  iconPositions: Record<string, IconPosition>;
  setIconPosition: (appType: string, pos: IconPosition) => void;
  dockOrder: string[] | null;
  setDockOrder: (order: string[]) => void;
  hiddenDesktopApps: string[];
  setHiddenDesktopApps: (ids: string[]) => void;
  placedWidgets: PlacedWidget[];
  setPlacedWidgets: (widgets: PlacedWidget[]) => void;
}

const DesktopSettingsContext = createContext<DesktopSettingsContext>({
  wallpaper: "image-betaversion",
  setWallpaper: () => {},
  iconPositions: {},
  setIconPosition: () => {},
  dockOrder: null,
  setDockOrder: () => {},
  hiddenDesktopApps: [],
  setHiddenDesktopApps: () => {},
  placedWidgets: [],
  setPlacedWidgets: () => {},
});

const STORAGE_PREFIX = "termloop-desktop-settings";

interface StoredSettings {
  wallpaper?: string;
  iconPositions?: Record<string, IconPosition>;
  dockOrder?: string[];
  hiddenDesktopApps?: string[];
  placedWidgets?: PlacedWidget[];
}

function storageKey(connectionId: string) {
  return `${STORAGE_PREFIX}:${connectionId}`;
}

function loadSettings(connectionId: string): StoredSettings {
  try {
    const stored = localStorage.getItem(storageKey(connectionId));
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function saveSettings(connectionId: string, settings: StoredSettings) {
  localStorage.setItem(storageKey(connectionId), JSON.stringify(settings));
}

interface DesktopSettingsProviderProps {
  connectionId: string;
  children: ReactNode;
}

export function DesktopSettingsProvider({ connectionId, children }: DesktopSettingsProviderProps) {
  const [wallpaper, setWallpaperState] = useState<string>(
    () => loadSettings(connectionId).wallpaper || "image-betaversion"
  );

  const [iconPositions, setIconPositions] = useState<Record<string, IconPosition>>(
    () => loadSettings(connectionId).iconPositions || {}
  );

  const [dockOrder, setDockOrderState] = useState<string[] | null>(
    () => loadSettings(connectionId).dockOrder || null
  );

  const [hiddenDesktopApps, setHiddenDesktopAppsState] = useState<string[]>(
    () => loadSettings(connectionId).hiddenDesktopApps || []
  );

  const [placedWidgets, setPlacedWidgetsState] = useState<PlacedWidget[]>(
    () => loadSettings(connectionId).placedWidgets || []
  );

  const persist = useCallback(
    (overrides: Partial<StoredSettings>) => {
      saveSettings(connectionId, {
        wallpaper,
        iconPositions,
        dockOrder: dockOrder ?? undefined,
        hiddenDesktopApps,
        placedWidgets,
        ...overrides,
      });
    },
    [connectionId, wallpaper, iconPositions, dockOrder, hiddenDesktopApps, placedWidgets]
  );

  const setWallpaper = useCallback((id: string) => {
    setWallpaperState(id);
    persist({ wallpaper: id });
  }, [persist]);

  const setIconPosition = useCallback((appType: string, pos: IconPosition) => {
    setIconPositions((prev) => {
      const next = { ...prev, [appType]: pos };
      persist({ iconPositions: next });
      return next;
    });
  }, [persist]);

  const setDockOrder = useCallback((order: string[]) => {
    setDockOrderState(order);
    persist({ dockOrder: order });
  }, [persist]);

  const setHiddenDesktopApps = useCallback((ids: string[]) => {
    setHiddenDesktopAppsState(ids);
    persist({ hiddenDesktopApps: ids });
  }, [persist]);

  const setPlacedWidgets = useCallback((widgets: PlacedWidget[]) => {
    setPlacedWidgetsState(widgets);
    persist({ placedWidgets: widgets });
  }, [persist]);

  return (
    <DesktopSettingsContext
      value={{
        wallpaper,
        setWallpaper,
        iconPositions,
        setIconPosition,
        dockOrder,
        setDockOrder,
        hiddenDesktopApps,
        setHiddenDesktopApps,
        placedWidgets,
        setPlacedWidgets,
      }}
    >
      {children}
    </DesktopSettingsContext>
  );
}

export const useDesktopSettings = () => useContext(DesktopSettingsContext);
