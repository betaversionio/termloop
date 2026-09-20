import type { MarketplaceApp } from "@termloop/shared";

const REGISTRY_URL =
  import.meta.env.VITE_REGISTRY_URL ?? "/registry/catalog.json";

export const marketplaceApi = {
  async fetchCatalog(): Promise<MarketplaceApp[]> {
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) throw new Error(`Failed to fetch catalog: ${res.status}`);
    return res.json() as Promise<MarketplaceApp[]>;
  },
};
