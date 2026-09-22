import type { MarketplaceApp, MarketplaceWidget } from "@termloop/shared";
import type { MarketplaceAppType } from "../os/types/window";

/** @deprecated Use `MarketplaceApp` from `@termloop/shared` directly */
export type MarketplaceAppManifest = MarketplaceApp;

export interface InstalledApp {
  manifest: MarketplaceAppManifest;
  installedAt: number;
}

export interface InstalledWidget {
  manifest: MarketplaceWidget;
  installedAt: number;
}

export function toMarketAppType(id: string): MarketplaceAppType {
  return `market:${id}`;
}

export function fromMarketAppType(appType: MarketplaceAppType): string {
  return appType.slice("market:".length);
}
