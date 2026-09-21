export type BuiltInAppType =
  | "file-manager"
  | "terminal"
  | "monitor"
  | "notepad"
  | "settings"
  | "browser"
  | "app-store";

export type MarketplaceAppType = `market:${string}`;

export type AppType = BuiltInAppType | MarketplaceAppType;

export function isMarketplaceApp(appType: AppType): appType is MarketplaceAppType {
  return appType.startsWith("market:");
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowState {
  id: string;
  appType: AppType;
  title: string;
  bounds: WindowBounds;
  prevBounds: WindowBounds | null;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
  minWidth: number;
  minHeight: number;
  payload?: Record<string, unknown>;
}

export type WindowAction =
  | { type: "OPEN"; appType: AppType; payload?: Record<string, unknown> }
  | { type: "CLOSE"; id: string }
  | { type: "FOCUS"; id: string }
  | { type: "MINIMIZE"; id: string }
  | { type: "MAXIMIZE"; id: string }
  | { type: "RESTORE"; id: string }
  | { type: "MOVE"; id: string; x: number; y: number }
  | { type: "RESIZE"; id: string; bounds: Partial<WindowBounds> }
  | { type: "RENAME"; id: string; title: string };
