import type { MarketplaceApp, MarketplaceWidget } from "@termloop/shared";

const REGISTRY_URL =
  import.meta.env.VITE_REGISTRY_URL ?? "/registry/catalog.json";

const WIDGETS_REGISTRY_URL =
  import.meta.env.VITE_WIDGETS_REGISTRY_URL ?? "/registry/widgets-catalog.json";

export const marketplaceApi = {
  async fetchCatalog(): Promise<MarketplaceApp[]> {
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) throw new Error(`Failed to fetch catalog: ${res.status}`);
    return res.json() as Promise<MarketplaceApp[]>;
  },

  async fetchWidgetsCatalog(): Promise<MarketplaceWidget[]> {
    const res = await fetch(WIDGETS_REGISTRY_URL);
    if (!res.ok) throw new Error(`Failed to fetch widgets catalog: ${res.status}`);
    return res.json() as Promise<MarketplaceWidget[]>;
  },
};
