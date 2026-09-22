import { useQuery } from "@tanstack/react-query";
import type { MarketplaceWidget } from "@termloop/shared";
import { marketplaceApi } from "../api";

export function useWidgetsCatalog() {
  return useQuery<MarketplaceWidget[]>({
    queryKey: ["marketplace", "widgets-catalog"],
    queryFn: marketplaceApi.fetchWidgetsCatalog,
    staleTime: 5 * 60 * 1000,
  });
}
