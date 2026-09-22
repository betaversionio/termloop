import { WindowManagerProvider } from "../context/window-manager-context";
import { DesktopSettingsProvider } from "../context/desktop-settings-context";
import { MarketplaceProvider } from "@/features/servers/marketplace/components/marketplace-context";
import { WidgetsProvider } from "@/features/servers/marketplace/components/widgets-context";
import { Desktop } from "./desktop/desktop";
import { Taskbar } from "./taskbar/taskbar";
import { MenuBar } from "./menubar/menu-bar";
import { FilePickerDialog } from "./file-picker-dialog";

interface OsPageProps {
  connectionId: string;
}

export function OsPage({ connectionId }: OsPageProps) {
  return (
    // Keyed by connectionId so switching servers remounts the whole desktop tree
    // instead of reusing state initialized for a different server.
    <DesktopSettingsProvider key={connectionId} connectionId={connectionId}>
      <WindowManagerProvider connectionId={connectionId}>
        <MarketplaceProvider connectionId={connectionId}>
          <WidgetsProvider connectionId={connectionId}>
            <div className="os-desktop fixed inset-0 z-50 flex flex-col">
              <MenuBar />
              <Desktop connectionId={connectionId} />
              <Taskbar />
            </div>
            <FilePickerDialog />
          </WidgetsProvider>
        </MarketplaceProvider>
      </WindowManagerProvider>
    </DesktopSettingsProvider>
  );
}
