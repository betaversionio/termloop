import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowManager } from "../../context/window-manager-context";
import { useDesktopSettings } from "../../context/desktop-settings-context";
import { useMarketplace } from "@/features/servers/marketplace/components/marketplace-context";
import { TASKBAR_HEIGHT } from "../../lib/os-constants";
import { WALLPAPERS } from "../../lib/wallpapers";
import { DesktopIcon } from "./desktop-icon";
import { DesktopContextMenu } from "./desktop-context-menu";
import { WindowFrame } from "../window/window-frame";
import { AppRenderer } from "../apps/app-renderer";
import { cn } from "@/lib/utils";
import type { AppType } from "../../types/window";
import type { IconPosition } from "../../context/desktop-settings-context";

const GRID_CELL = 90;

/** Compute default grid positions (top→bottom, left→right) for icons without saved positions */
function getDefaultPositions(
  apps: AppType[],
  saved: Record<string, IconPosition>,
  containerHeight: number,
): Record<string, IconPosition> {
  const result: Record<string, IconPosition> = {};
  const usableHeight = containerHeight - TASKBAR_HEIGHT;
  const rows = Math.max(1, Math.floor(usableHeight / GRID_CELL));

  let col = 0;
  let row = 0;
  for (const appType of apps) {
    if (saved[appType]) {
      result[appType] = saved[appType];
    } else {
      result[appType] = {
        x: col * GRID_CELL,
        y: row * GRID_CELL,
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
  const { wallpaper, setWallpaper, iconPositions } = useDesktopSettings();
  const { desktopApps } = useMarketplace();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

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
        />
      ))}

      {/* Windows */}
      {state.windows.map((win) => (
        <WindowFrame key={win.id} window={win}>
          <AppRenderer
            appType={win.appType}
            connectionId={connectionId}
            payload={win.payload}
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
    </div>
  );
}
