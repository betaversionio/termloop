import type { MarketplaceApp } from "./marketplace.js";

export interface MarketplaceWidget {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  iconUrl: string;
  bundleUrl: string;
  /** At least one size must be given; a placed widget picks one of these. */
  sizes: Partial<Record<"small" | "medium" | "large", { width: number; height: number }>>;
  /**
   * A marketplace app id this widget belongs to — the widget stays locked in the
   * gallery until that app is installed (e.g. a "Docker Containers" widget requiring
   * the Docker app). Omit for a fully standalone widget.
   */
  requiresApp?: string;
  category: MarketplaceApp["category"];
  tags?: string[];
  /** Same semantics as `MarketplaceApp.incompatiblePlatforms` — `uname -s` values. */
  incompatiblePlatforms?: string[];
}
