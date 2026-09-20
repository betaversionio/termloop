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

const STORAGE_KEY = "termloop-marketplace-installed";

function loadInstalledApps(): InstalledApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as InstalledApp[];
  } catch {}
  return [];
}

function saveInstalledApps(apps: InstalledApp[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
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
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>(loadInstalledApps);

  const { data: catalog = [], isLoading: catalogLoading, error: catalogError } = useMarketplaceCatalog();

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

  // Persist to localStorage
  useEffect(() => {
    saveInstalledApps(installedApps);
  }, [installedApps]);

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

  // Build dynamic desktop/dock app lists
  const desktopApps = useMemo<AppType[]>(() => {
    const marketDesktop = installedApps
      .filter((a) => a.manifest.showOnDesktop)
      .map((a) => toMarketAppType(a.manifest.id) as AppType);
    return [...BUILTIN_DESKTOP_APPS, ...marketDesktop];
  }, [installedApps]);

  const dockApps = useMemo<AppType[]>(() => {
    const marketDock = installedApps
      .filter((a) => a.manifest.showInDock)
      .map((a) => toMarketAppType(a.manifest.id) as AppType);
    return [...BUILTIN_DOCK_APPS, ...marketDock];
  }, [installedApps]);

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
