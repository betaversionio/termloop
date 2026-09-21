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
  screenshots?: string[];
  rating?: number;
  ratingCount?: number;
  installCount?: number;
  reviews?: MarketplaceReview[];
}
