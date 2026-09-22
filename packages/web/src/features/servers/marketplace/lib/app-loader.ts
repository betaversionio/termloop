import type { MarketplaceAppManifest } from "../types";
import type { TermLoopSDK, MarketplaceAppProps, WidgetProps } from "./sdk";
import type { MarketplaceWidget } from "@termloop/shared";

// The global __termloop_register/React declarations live in @termloop/react
// (imported transitively via ./sdk) — this file just uses them.

interface LoadedBundle<TProps> {
  Component: React.ComponentType<TProps>;
}

/** A loadable manifest — apps and widgets only differ in props shape (checked at
 * the call site via TProps), so this generic loader is shared by both. */
interface Loadable {
  id: string;
  bundleUrl: string;
}

/** Injects `manifest.bundleUrl` as a `<script>` into document.head (main-world
 * execution — no iframe/sandbox), which calls the global `__termloop_register(id,
 * factory)`. Each call site (apps vs. widgets) gets its own independent cache so an
 * app id and a widget id can never collide. */
function createBundleLoader<TProps>() {
  const loaded = new Map<string, LoadedBundle<TProps>>();
  const pending = new Map<string, Promise<LoadedBundle<TProps>>>();

  async function load(manifest: Loadable, sdk: TermLoopSDK): Promise<LoadedBundle<TProps>> {
    const cached = loaded.get(manifest.id);
    if (cached) return cached;

    const inFlight = pending.get(manifest.id);
    if (inFlight) return inFlight;

    // Expose React globally so bundles built with
    // `external: ['react']` + `globals: { react: 'React' }` can resolve it
    window.React = sdk.React;

    const promise = new Promise<LoadedBundle<TProps>>((resolve, reject) => {
      window.__termloop_register = (id, factory) => {
        if (id !== manifest.id) return;

        try {
          const result = factory(sdk) as { default: React.ComponentType<TProps> };
          const result_: LoadedBundle<TProps> = { Component: result.default };
          loaded.set(manifest.id, result_);
          pending.delete(manifest.id);
          resolve(result_);
        } catch (err) {
          pending.delete(manifest.id);
          reject(err);
        }
      };

      const script = document.createElement("script");
      script.src = manifest.bundleUrl;
      script.async = true;
      script.onerror = () => {
        pending.delete(manifest.id);
        reject(new Error(`Failed to load bundle: ${manifest.bundleUrl}`));
      };
      document.head.appendChild(script);
    });

    pending.set(manifest.id, promise);
    return promise;
  }

  function unload(id: string) {
    loaded.delete(id);
    pending.delete(id);
  }

  function isLoaded(id: string): boolean {
    return loaded.has(id);
  }

  return { load, unload, isLoaded };
}

const appLoader = createBundleLoader<MarketplaceAppProps>();
const widgetLoader = createBundleLoader<WidgetProps>();

export function loadMarketplaceApp(manifest: MarketplaceAppManifest, sdk: TermLoopSDK) {
  return appLoader.load(manifest, sdk);
}
export function unloadMarketplaceApp(id: string) {
  appLoader.unload(id);
}
export function isAppLoaded(id: string): boolean {
  return appLoader.isLoaded(id);
}

export function loadMarketplaceWidget(manifest: MarketplaceWidget, sdk: TermLoopSDK) {
  return widgetLoader.load(manifest, sdk);
}
export function unloadMarketplaceWidget(id: string) {
  widgetLoader.unload(id);
}
export function isWidgetLoaded(id: string): boolean {
  return widgetLoader.isLoaded(id);
}
