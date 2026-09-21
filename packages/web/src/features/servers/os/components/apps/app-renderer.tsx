import { isMarketplaceApp, type AppType, type MarketplaceAppType } from "../../types/window";
import { fromMarketAppType } from "@/features/servers/marketplace/types";
import { useMarketplace } from "@/features/servers/marketplace/components/marketplace-context";
import { MarketplaceAppHost } from "@/features/servers/marketplace/components/marketplace-app-host";
import { FileManagerApp } from "./file-manager/file-manager-app";
import { TerminalApp } from "./terminal-app";
import { MonitorApp } from "./monitor-app";
import { NotepadApp } from "./notepad-app";
import { SettingsApp } from "./settings-app";
import { BrowserApp } from "./browser-app";
import { AppStoreApp } from "./app-store-app";

interface AppRendererProps {
  appType: AppType;
  connectionId: string;
  payload?: Record<string, unknown>;
  windowId: string;
}

export function AppRenderer({ appType, connectionId, payload, windowId }: AppRendererProps) {
  if (isMarketplaceApp(appType)) {
    return (
      <MarketplaceAppRenderer
        appType={appType}
        connectionId={connectionId}
        payload={payload}
        windowId={windowId}
      />
    );
  }

  switch (appType) {
    case "file-manager":
      return <FileManagerApp connectionId={connectionId} />;
    case "terminal":
      return <TerminalApp connectionId={connectionId} />;
    case "monitor":
      return <MonitorApp connectionId={connectionId} />;
    case "notepad":
      return <NotepadApp connectionId={connectionId} payload={payload} />;
    case "settings":
      return <SettingsApp />;
    case "browser":
      return <BrowserApp connectionId={connectionId} />;
    case "app-store":
      return <AppStoreApp />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          Unknown app: {appType}
        </div>
      );
  }
}

function MarketplaceAppRenderer({
  appType,
  connectionId,
  payload,
  windowId,
}: {
  appType: MarketplaceAppType;
  connectionId: string;
  payload?: Record<string, unknown>;
  windowId: string;
}) {
  const { installedApps } = useMarketplace();
  const appId = fromMarketAppType(appType);
  const installed = installedApps.find((a) => a.manifest.id === appId);

  if (!installed) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        App not installed: {appId}
      </div>
    );
  }

  return (
    <MarketplaceAppHost
      manifest={installed.manifest}
      connectionId={connectionId}
      payload={payload}
      windowId={windowId}
    />
  );
}
