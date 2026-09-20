import { WindowManagerProvider } from "../context/window-manager-context";
import { DesktopSettingsProvider } from "../context/desktop-settings-context";
import { MarketplaceProvider } from "@/features/servers/marketplace/components/marketplace-context";
import { Desktop } from "./desktop/desktop";
import { Taskbar } from "./taskbar/taskbar";
import { MenuBar } from "./menubar/menu-bar";

interface OsPageProps {
  connectionId: string;
}

export function OsPage({ connectionId }: OsPageProps) {
  return (
    <DesktopSettingsProvider>
      <WindowManagerProvider>
        <MarketplaceProvider connectionId={connectionId}>
          <div className="fixed inset-0 z-50 flex flex-col">
            <MenuBar />
            <Desktop connectionId={connectionId} />
            <Taskbar />
          </div>
        </MarketplaceProvider>
      </WindowManagerProvider>
    </DesktopSettingsProvider>
  );
}
