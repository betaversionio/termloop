import type { MarketplaceAppManifest } from "../types";
import type { TermLoopSDK, MarketplaceAppProps } from "./sdk";

type AppFactory = (sdk: TermLoopSDK) => {
  default: React.ComponentType<MarketplaceAppProps>;
};

interface LoadedApp {
  Component: React.ComponentType<MarketplaceAppProps>;
}

declare global {
  interface Window {
    __termloop_register?: (id: string, factory: AppFactory) => void;
    React?: typeof import("react");
  }
}

const loadedApps = new Map<string, LoadedApp>();
const pendingLoads = new Map<string, Promise<LoadedApp>>();

export function setupGlobalRegister() {
  // The register function is set per-load call, not globally
}

export async function loadMarketplaceApp(
  manifest: MarketplaceAppManifest,
  sdk: TermLoopSDK
): Promise<LoadedApp> {
  // Return from cache
  const cached = loadedApps.get(manifest.id);
  if (cached) return cached;

  // Dedup concurrent loads
  const pending = pendingLoads.get(manifest.id);
  if (pending) return pending;

  // Expose React globally so marketplace apps built with
  // `external: ['react']` + `globals: { react: 'React' }` can resolve it
  window.React = sdk.React;

  const promise = new Promise<LoadedApp>((resolve, reject) => {
    // Set up the global register callback
    window.__termloop_register = (id: string, factory: AppFactory) => {
      if (id !== manifest.id) return;

      try {
        const result = factory(sdk);
        const loaded: LoadedApp = { Component: result.default };
        loadedApps.set(manifest.id, loaded);
        pendingLoads.delete(manifest.id);
        resolve(loaded);
      } catch (err) {
        pendingLoads.delete(manifest.id);
        reject(err);
      }
    };

    // Inject script tag
    const script = document.createElement("script");
    script.src = manifest.bundleUrl;
    script.async = true;
    script.onerror = () => {
      pendingLoads.delete(manifest.id);
      reject(new Error(`Failed to load app bundle: ${manifest.bundleUrl}`));
    };
    document.head.appendChild(script);
  });

  pendingLoads.set(manifest.id, promise);
  return promise;
}

export function unloadMarketplaceApp(id: string) {
  loadedApps.delete(id);
  pendingLoads.delete(id);
}

export function isAppLoaded(id: string): boolean {
  return loadedApps.has(id);
}
