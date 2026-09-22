import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowManager } from "../../context/window-manager-context";
import { useDesktopSettings } from "../../context/desktop-settings-context";
import { useMarketplace } from "@/features/servers/marketplace/components/marketplace-context";
import { fromMarketAppType } from "@/features/servers/marketplace/types";
import { useDockApps } from "../../hooks/use-dock-apps";
import { TASKBAR_HEIGHT, MENU_BAR_HEIGHT } from "../../lib/os-constants";
import { WALLPAPERS } from "../../lib/wallpapers";
import { DesktopIcon } from "./desktop-icon";
import { DesktopContextMenu } from "./desktop-context-menu";
import { DesktopIconContextMenu } from "./desktop-icon-context-menu";
import { WindowFrame } from "../window/window-frame";
import { AppRenderer } from "../apps/app-renderer";
import { cn } from "@/lib/utils";
import { isMarketplaceApp, type AppType } from "../../types/window";
import type { IconPosition } from "../../context/desktop-settings-context";

const GRID_CELL = 90;

/** Compute default grid positions (top→bottom, left→right) for icons without saved positions */
function getDefaultPositions(
  apps: AppType[],
  saved: Record<string, IconPosition>,
  containerHeight: number,
): Record<string, IconPosition> {
  const result: Record<string, IconPosition> = {};
  const usableHeight = containerHeight - TASKBAR_HEIGHT - MENU_BAR_HEIGHT;
  const rows = Math.max(1, Math.floor(usableHeight / GRID_CELL));

  let col = 0;
  let row = 0;
  for (const appType of apps) {
    if (saved[appType]) {
      result[appType] = saved[appType];
    } else {
      result[appType] = {
        x: col * GRID_CELL,
        y: MENU_BAR_HEIGHT + row * GRID_CELL,
      };
      row++;
      if (row >= rows) {
        row = 0;
        col++;
      }
    }
  }
  return result;
}

interface DesktopProps {
  connectionId: string;
}

export function Desktop({ connectionId }: DesktopProps) {
  const { state, dispatch } = useWindowManager();
  const { wallpaper, setWallpaper, iconPositions, hiddenDesktopApps, setHiddenDesktopApps, setDockOrder } =
    useDesktopSettings();
  const { desktopApps: allDesktopApps, uninstallApp } = useMarketplace();
  const dockApps = useDockApps();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [iconContextMenu, setIconContextMenu] = useState<{ x: number; y: number; appType: AppType } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const desktopApps = useMemo(
    () => allDesktopApps.filter((t) => !hiddenDesktopApps.includes(t)),
    [allDesktopApps, hiddenDesktopApps]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setContainerRect(el.getBoundingClientRect());
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const wp = useMemo(
    () => WALLPAPERS.find((w) => w.id === wallpaper),
    [wallpaper]
  );

  const isImage = wp?.type === "image";

  const positions = useMemo(
    () => getDefaultPositions(desktopApps, iconPositions, containerRect?.height ?? 600),
    [desktopApps, iconPositions, containerRect?.height],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const handleOpenApp = useCallback(
    (appType: AppType) => {
      dispatch({ type: "OPEN", appType });
    },
    [dispatch]
  );

  const handleFocusWindow = useCallback(
    (id: string) => {
      const win = state.windows.find((w) => w.id === id);
      if (!win) return;
      dispatch({ type: win.minimized ? "RESTORE" : "FOCUS", id });
    },
    [state.windows, dispatch]
  );

  const handleQuit = useCallback(
    (appType: AppType) => {
      for (const w of state.windows.filter((w) => w.appType === appType)) {
        dispatch({ type: "CLOSE", id: w.id });
      }
    },
    [state.windows, dispatch]
  );

  const handlePinToDock = useCallback(
    (appType: AppType) => {
      if (!dockApps.includes(appType)) setDockOrder([...dockApps, appType]);
    },
    [dockApps, setDockOrder]
  );

  const handleRemoveFromDesktop = useCallback(
    (appType: AppType) => {
      setHiddenDesktopApps([...hiddenDesktopApps, appType]);
    },
    [hiddenDesktopApps, setHiddenDesktopApps]
  );

  const handleUninstall = useCallback(
    (appType: AppType) => {
      if (isMarketplaceApp(appType)) uninstallApp(fromMarketAppType(appType));
    },
    [uninstallApp]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex-1 overflow-hidden",
        !isImage && wp?.value
      )}
      style={
        isImage
          ? {
              // Network-hosted wallpapers (the default + all "photo-*" options) take a moment to
              // load; without a fallback color, the page behind this overlay flashes through until
              // then. The SVG pattern wallpapers already bake their own solid layer into the data
              // URI itself, so this is only ever visible during that brief real-image load window.
              backgroundColor: "#0a0a0a",
              backgroundImage: wp.value.startsWith('url(') ? wp.value : `url(${wp.value})`,
              backgroundSize: wp.value.startsWith('url("data:') ? 'auto' : 'cover',
              backgroundPosition: "center",
            }
          : undefined
      }
      onContextMenu={handleContextMenu}
    >
      {/* Desktop icons — free-positioned, snap to grid */}
      {desktopApps.map((appType) => (
        <DesktopIcon
          key={appType}
          appType={appType}
          position={positions[appType] ?? { x: 0, y: 0 }}
          containerRect={containerRect}
          onContextMenu={(e) => setIconContextMenu({ x: e.clientX, y: e.clientY, appType })}
        />
      ))}

      {/* Windows */}
      {state.windows.map((win) => (
        <WindowFrame key={win.id} window={win}>
          <AppRenderer
            appType={win.appType}
            connectionId={connectionId}
            payload={win.payload}
            windowId={win.id}
          />
        </WindowFrame>
      ))}

      {/* Desktop right-click context menu */}
      {contextMenu && (
        <DesktopContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onOpenApp={handleOpenApp}
          onChangeWallpaper={setWallpaper}
          currentWallpaper={wallpaper}
        />
      )}

      {/* Desktop icon right-click context menu */}
      {iconContextMenu && (
        <DesktopIconContextMenu
          x={iconContextMenu.x}
          y={iconContextMenu.y}
          appType={iconContextMenu.appType}
          windows={state.windows.filter((w) => w.appType === iconContextMenu.appType)}
          isPinnedToDock={dockApps.includes(iconContextMenu.appType)}
          canUninstall={isMarketplaceApp(iconContextMenu.appType)}
          onClose={() => setIconContextMenu(null)}
          onOpen={() => handleOpenApp(iconContextMenu.appType)}
          onFocusWindow={handleFocusWindow}
          onQuit={() => handleQuit(iconContextMenu.appType)}
          onPinToDock={() => handlePinToDock(iconContextMenu.appType)}
          onRemoveFromDesktop={() => handleRemoveFromDesktop(iconContextMenu.appType)}
          onUninstall={() => handleUninstall(iconContextMenu.appType)}
        />
      )}
    </div>
  );
}
