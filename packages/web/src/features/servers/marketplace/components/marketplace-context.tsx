import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppType } from "../../os/types/window";
import type { InstalledApp, MarketplaceAppManifest } from "../types";
import { toMarketAppType } from "../types";
import { useMarketplaceCatalog } from "../hooks/use-marketplace-catalog";
import { appRegistry, type AppDefinition, BUILTIN_DESKTOP_APPS, BUILTIN_DOCK_APPS } from "../../os/lib/os-constants";
import {
  buildAssociationMap,
  resolveFileHandler as resolveFileHandlerFn,
  getFileHandlers as getFileHandlersFn,
  type FileAssociationMap,
} from "../lib/file-associations";
import { buildSDK, type TermLoopSDK } from "../lib/sdk";
import { loadMarketplaceApp, unloadMarketplaceApp } from "../lib/app-loader";
import type { MarketplaceAppProps } from "../lib/sdk";
import { isPlatformCompatible } from "../lib/platform-compat";
import { useServerConnection } from "../../hooks/use-server-connection";

const STORAGE_PREFIX = "termloop-marketplace-installed";

function storageKey(connectionId: string) {
  return `${STORAGE_PREFIX}:${connectionId}`;
}

function loadInstalledApps(connectionId: string): InstalledApp[] {
  try {
    const raw = localStorage.getItem(storageKey(connectionId));
    if (raw) return JSON.parse(raw) as InstalledApp[];
  } catch {}
  return [];
}

function saveInstalledApps(connectionId: string, apps: InstalledApp[]) {
  try {
    localStorage.setItem(storageKey(connectionId), JSON.stringify(apps));
  } catch {}
}

interface MarketplaceContextValue {
  catalog: MarketplaceAppManifest[];
  catalogLoading: boolean;
  catalogError: Error | null;
  installedApps: InstalledApp[];
  installApp: (manifest: MarketplaceAppManifest) => void;
  uninstallApp: (id: string) => void;
  isInstalled: (id: string) => boolean;
  resolveFileHandler: (fileName: string) => AppType;
  getFileHandlers: (fileName: string) => { appType: AppType; label: string }[];
  loadApp: (manifest: MarketplaceAppManifest) => Promise<React.ComponentType<MarketplaceAppProps>>;
  desktopApps: AppType[];
  dockApps: AppType[];
}

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

interface MarketplaceProviderProps {
  connectionId: string;
  children: ReactNode;
}

export function MarketplaceProvider({ connectionId, children }: MarketplaceProviderProps) {
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>(() =>
    loadInstalledApps(connectionId)
  );

  const { data: rawCatalog = [], isLoading: catalogLoading, error: catalogError } = useMarketplaceCatalog();
  const connection = useServerConnection(connectionId);
  const platform = connection?.systemInfo?.platform;

  // Hide apps the connected server's platform can't run (e.g. a Docker app on IBM i PASE)
  const catalog = useMemo(
    () => rawCatalog.filter((app) => isPlatformCompatible(app, platform)),
    [rawCatalog, platform]
  );

  const sdk = useMemo<TermLoopSDK>(() => buildSDK(), []);

  // Rebuild association map when installed apps change
  const associationMap = useMemo<FileAssociationMap>(
    () => buildAssociationMap(installedApps),
    [installedApps]
  );

  // Register/unregister marketplace apps in the mutable appRegistry
  useEffect(() => {
    for (const { manifest } of installedApps) {
      const marketType = toMarketAppType(manifest.id);
      if (!appRegistry.has(marketType)) {
        const def: AppDefinition = {
          type: marketType,
          title: manifest.name,
          icon: "package",
          iconUrl: manifest.iconUrl,
          defaultSize: manifest.defaultSize,
          minWidth: manifest.minWidth,
          minHeight: manifest.minHeight,
        };
        appRegistry.set(marketType, def);
      }
    }
  }, [installedApps]);

  // Persist to localStorage, scoped per server
  useEffect(() => {
    saveInstalledApps(connectionId, installedApps);
  }, [connectionId, installedApps]);

  const installApp = useCallback((manifest: MarketplaceAppManifest) => {
    setInstalledApps((prev) => {
      if (prev.some((a) => a.manifest.id === manifest.id)) return prev;
      const app: InstalledApp = { manifest, installedAt: Date.now() };

      // Register in appRegistry
      const marketType = toMarketAppType(manifest.id);
      appRegistry.set(marketType, {
        type: marketType,
        title: manifest.name,
        icon: "package",
        iconUrl: manifest.iconUrl,
        defaultSize: manifest.defaultSize,
        minWidth: manifest.minWidth,
        minHeight: manifest.minHeight,
      });

      return [...prev, app];
    });
  }, []);

  const uninstallApp = useCallback((id: string) => {
    setInstalledApps((prev) => prev.filter((a) => a.manifest.id !== id));
    appRegistry.delete(toMarketAppType(id));
    unloadMarketplaceApp(id);
  }, []);

  const isInstalled = useCallback(
    (id: string) => installedApps.some((a) => a.manifest.id === id),
    [installedApps]
  );

  const resolveFileHandler = useCallback(
    (fileName: string) => resolveFileHandlerFn(fileName, associationMap),
    [associationMap]
  );

  const getFileHandlers = useCallback(
    (fileName: string) => getFileHandlersFn(fileName, associationMap),
    [associationMap]
  );

  const loadApp = useCallback(
    async (manifest: MarketplaceAppManifest) => {
      const loaded = await loadMarketplaceApp(manifest, sdk);
      return loaded.Component;
    },
    [sdk]
  );

  // Build dynamic desktop/dock app lists — installed apps incompatible with the
  // connected server's platform are excluded even if they were installed elsewhere
  const desktopApps = useMemo<AppType[]>(() => {
    const marketDesktop = installedApps
      .filter((a) => a.manifest.showOnDesktop && isPlatformCompatible(a.manifest, platform))
      .map((a) => toMarketAppType(a.manifest.id) as AppType);
    return [...BUILTIN_DESKTOP_APPS, ...marketDesktop];
  }, [installedApps, platform]);

  const dockApps = useMemo<AppType[]>(() => {
    const marketDock = installedApps
      .filter((a) => a.manifest.showInDock && isPlatformCompatible(a.manifest, platform))
      .map((a) => toMarketAppType(a.manifest.id) as AppType);
    return [...BUILTIN_DOCK_APPS, ...marketDock];
  }, [installedApps, platform]);

  const value = useMemo<MarketplaceContextValue>(
    () => ({
      catalog,
      catalogLoading,
      catalogError: catalogError as Error | null,
      installedApps,
      installApp,
      uninstallApp,
      isInstalled,
      resolveFileHandler,
      getFileHandlers,
      loadApp,
      desktopApps,
      dockApps,
    }),
    [catalog, catalogLoading, catalogError, installedApps, installApp, uninstallApp, isInstalled, resolveFileHandler, getFileHandlers, loadApp, desktopApps, dockApps]
  );

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx)
    throw new Error("useMarketplace must be used within MarketplaceProvider");
  return ctx;
}
