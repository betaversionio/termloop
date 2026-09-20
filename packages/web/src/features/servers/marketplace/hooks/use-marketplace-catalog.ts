import { useQuery } from "@tanstack/react-query";
import type { MarketplaceApp } from "@termloop/shared";
import { marketplaceApi } from "../api";

export function useMarketplaceCatalog() {
  return useQuery<MarketplaceApp[]>({
    queryKey: ["marketplace", "catalog"],
    queryFn: marketplaceApi.fetchCatalog,
    staleTime: 5 * 60 * 1000,
  });
}
