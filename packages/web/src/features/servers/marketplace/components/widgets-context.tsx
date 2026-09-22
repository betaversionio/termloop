import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MarketplaceWidget } from "@termloop/shared";
import type { InstalledWidget } from "../types";
import { useWidgetsCatalog } from "../hooks/use-widgets-catalog";
import { buildSDK, type TermLoopSDK, type WidgetProps } from "../lib/sdk";
import { loadMarketplaceWidget, unloadMarketplaceWidget } from "../lib/app-loader";
import { isPlatformCompatible } from "../lib/platform-compat";
import { useServerConnection } from "../../hooks/use-server-connection";
import { useMarketplace } from "./marketplace-context";

const STORAGE_PREFIX = "termloop-widgets-installed";

function storageKey(connectionId: string) {
  return `${STORAGE_PREFIX}:${connectionId}`;
}

function loadInstalledWidgets(connectionId: string): InstalledWidget[] {
  try {
    const raw = localStorage.getItem(storageKey(connectionId));
    if (raw) return JSON.parse(raw) as InstalledWidget[];
  } catch {}
  return [];
}

function saveInstalledWidgets(connectionId: string, widgets: InstalledWidget[]) {
  try {
    localStorage.setItem(storageKey(connectionId), JSON.stringify(widgets));
  } catch {}
}

interface WidgetsContextValue {
  catalog: MarketplaceWidget[];
  catalogLoading: boolean;
  catalogError: Error | null;
  installedWidgets: InstalledWidget[];
  installWidget: (manifest: MarketplaceWidget) => void;
  uninstallWidget: (id: string) => void;
  isInstalled: (id: string) => boolean;
  /** True if the widget requires an app that isn't installed on this connection. */
  isLocked: (widget: MarketplaceWidget) => boolean;
  loadWidget: (manifest: MarketplaceWidget) => Promise<React.ComponentType<WidgetProps>>;
}

const WidgetsContext = createContext<WidgetsContextValue | null>(null);

interface WidgetsProviderProps {
  connectionId: string;
  children: ReactNode;
}

export function WidgetsProvider({ connectionId, children }: WidgetsProviderProps) {
  const [installedWidgets, setInstalledWidgets] = useState<InstalledWidget[]>(() =>
    loadInstalledWidgets(connectionId)
  );

  const { data: rawCatalog = [], isLoading: catalogLoading, error: catalogError } = useWidgetsCatalog();
  const { installedApps } = useMarketplace();
  const connection = useServerConnection(connectionId);
  const platform = connection?.systemInfo?.platform;

  const catalog = useMemo(
    () => rawCatalog.filter((w) => isPlatformCompatible(w, platform)),
    [rawCatalog, platform]
  );

  const sdk = useMemo<TermLoopSDK>(() => buildSDK(), []);

  useEffect(() => {
    saveInstalledWidgets(connectionId, installedWidgets);
  }, [connectionId, installedWidgets]);

  const installWidget = useCallback((manifest: MarketplaceWidget) => {
    setInstalledWidgets((prev) => {
      if (prev.some((w) => w.manifest.id === manifest.id)) return prev;
      return [...prev, { manifest, installedAt: Date.now() }];
    });
  }, []);

  const uninstallWidget = useCallback((id: string) => {
    setInstalledWidgets((prev) => prev.filter((w) => w.manifest.id !== id));
    unloadMarketplaceWidget(id);
  }, []);

  const isInstalled = useCallback(
    (id: string) => installedWidgets.some((w) => w.manifest.id === id),
    [installedWidgets]
  );

  const isLocked = useCallback(
    (widget: MarketplaceWidget) =>
      !!widget.requiresApp && !installedApps.some((a) => a.manifest.id === widget.requiresApp),
    [installedApps]
  );

  const loadWidget = useCallback(
    async (manifest: MarketplaceWidget) => {
      const loaded = await loadMarketplaceWidget(manifest, sdk);
      return loaded.Component;
    },
    [sdk]
  );

  const value = useMemo<WidgetsContextValue>(
    () => ({
      catalog,
      catalogLoading,
      catalogError: catalogError as Error | null,
      installedWidgets,
      installWidget,
      uninstallWidget,
      isInstalled,
      isLocked,
      loadWidget,
    }),
    [catalog, catalogLoading, catalogError, installedWidgets, installWidget, uninstallWidget, isInstalled, isLocked, loadWidget]
  );

  return <WidgetsContext.Provider value={value}>{children}</WidgetsContext.Provider>;
}

export function useWidgets() {
  const ctx = useContext(WidgetsContext);
  if (!ctx) throw new Error("useWidgets must be used within WidgetsProvider");
  return ctx;
}
