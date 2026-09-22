export interface MarketplaceReview {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface MarketplaceApp {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  iconUrl: string;
  bundleUrl: string;
  fileAssociations: string[];
  defaultSize: { width: number; height: number };
  minWidth: number;
  minHeight: number;
  showOnDesktop: boolean;
  showInDock: boolean;
  category: "tools" | "media" | "development" | "utilities" | "other";
  tags?: string[];
  /**
   * `uname -s` platform values (e.g. "Linux", "Darwin", "OS400") this app cannot
   * run against — used to hide it from the App Store and desktop/dock on servers
   * where it wouldn't work (e.g. a Docker app on IBM i PASE, which has no daemon).
   */
  incompatiblePlatforms?: string[];
  screenshots?: string[];
  rating?: number;
  ratingCount?: number;
  installCount?: number;
  reviews?: MarketplaceReview[];
}
