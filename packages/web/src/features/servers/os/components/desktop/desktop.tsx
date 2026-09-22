import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowManager } from "../../context/window-manager-context";
import { useDesktopSettings } from "../../context/desktop-settings-context";
import { useMarketplace } from "@/features/servers/marketplace/components/marketplace-context";
import { useWidgets } from "@/features/servers/marketplace/components/widgets-context";
import { fromMarketAppType } from "@/features/servers/marketplace/types";
import { useDockApps } from "../../hooks/use-dock-apps";
import { TASKBAR_HEIGHT, MENU_BAR_HEIGHT, GRID_CELL, WIDGET_GAP } from "../../lib/os-constants";
import { WALLPAPERS } from "../../lib/wallpapers";
import { DesktopIcon } from "./desktop-icon";
import { DesktopContextMenu } from "./desktop-context-menu";
import { DesktopIconContextMenu } from "./desktop-icon-context-menu";
import { WidgetFrame } from "../widgets/widget-frame";
import { WidgetGallery } from "../widgets/widget-gallery";
import { WidgetContextMenu } from "../widgets/widget-context-menu";
import { WindowFrame } from "../window/window-frame";
import { AppRenderer } from "../apps/app-renderer";
import { cn } from "@/lib/utils";
import { isMarketplaceApp, type AppType } from "../../types/window";
import type { IconPosition, PlacedWidget, WidgetSize } from "../../context/desktop-settings-context";
import type { MarketplaceWidget } from "@termloop/shared";

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

// Largest footprint any current widget size can have (matches "large" — 4x4 grid
// cells) — the cascade steps by this much so newly-placed widgets never overlap
// regardless of size, with a WIDGET_GAP margin baked into each step.
const MAX_WIDGET_CELLS = 4;

/** Simple cascading placement for newly-added widgets — no bin-packing, the user
 * drags to reposition afterward just like windows and icons already work. */
function getNextWidgetPosition(existing: PlacedWidget[], containerRect: DOMRect | null): IconPosition {
  const step = GRID_CELL * MAX_WIDGET_CELLS + WIDGET_GAP;
  const startX = WIDGET_GAP;
  const startY = MENU_BAR_HEIGHT + WIDGET_GAP;
  const maxWidth = containerRect?.width ?? 1200;
  const perRow = Math.max(1, Math.floor((maxWidth - startX) / step));
  const index = existing.length;
  const col = index % perRow;
  const row = Math.floor(index / perRow);
  return { x: startX + col * step, y: startY + row * step };
}

function randomId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `w-${Date.now()}-${Math.random()}`;
}

interface DesktopProps {
  connectionId: string;
}

export function Desktop({ connectionId }: DesktopProps) {
  const { state, dispatch } = useWindowManager();
  const {
    wallpaper,
    setWallpaper,
    iconPositions,
    hiddenDesktopApps,
    setHiddenDesktopApps,
    setDockOrder,
    placedWidgets,
    setPlacedWidgets,
  } = useDesktopSettings();
  const { desktopApps: allDesktopApps, uninstallApp } = useMarketplace();
  const { catalog: widgetsCatalog, installWidget } = useWidgets();
  const dockApps = useDockApps();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [iconContextMenu, setIconContextMenu] = useState<{ x: number; y: number; appType: AppType } | null>(null);
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false);
  const [widgetContextMenu, setWidgetContextMenu] = useState<{ x: number; y: number; instanceId: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const widgetById = useMemo(
    () => new Map(widgetsCatalog.map((w) => [w.id, w])),
    [widgetsCatalog]
  );

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

  const handlePlaceWidget = useCallback(
    (manifest: MarketplaceWidget) => {
      installWidget(manifest);
      const size = (Object.keys(manifest.sizes)[0] ?? "small") as WidgetSize;
      const position = getNextWidgetPosition(placedWidgets, containerRect);
      const next: PlacedWidget = { instanceId: randomId(), widgetId: manifest.id, size, position };
      setPlacedWidgets([...placedWidgets, next]);
      setWidgetGalleryOpen(false);
    },
    [installWidget, placedWidgets, setPlacedWidgets, containerRect]
  );

  const handleResizeWidget = useCallback(
    (instanceId: string, size: WidgetSize) => {
      setPlacedWidgets(placedWidgets.map((w) => (w.instanceId === instanceId ? { ...w, size } : w)));
    },
    [placedWidgets, setPlacedWidgets]
  );

  const handleRemoveWidget = useCallback(
    (instanceId: string) => {
      setPlacedWidgets(placedWidgets.filter((w) => w.instanceId !== instanceId));
    },
    [placedWidgets, setPlacedWidgets]
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
      {/* Widgets — sit between the wallpaper and the desktop icons */}
      {placedWidgets.map((placed) => {
        const manifest = widgetById.get(placed.widgetId);
        if (!manifest) return null;
        return (
          <WidgetFrame
            key={placed.instanceId}
            placed={placed}
            manifest={manifest}
            connectionId={connectionId}
            containerRect={containerRect}
            onContextMenu={(e) => setWidgetContextMenu({ x: e.clientX, y: e.clientY, instanceId: placed.instanceId })}
          />
        );
      })}

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
          onEditWidgets={() => setWidgetGalleryOpen(true)}
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

      {/* Widget right-click context menu */}
      {widgetContextMenu &&
        (() => {
          const placed = placedWidgets.find((w) => w.instanceId === widgetContextMenu.instanceId);
          const manifest = placed && widgetById.get(placed.widgetId);
          if (!placed || !manifest) return null;
          return (
            <WidgetContextMenu
              x={widgetContextMenu.x}
              y={widgetContextMenu.y}
              manifest={manifest}
              currentSize={placed.size}
              onClose={() => setWidgetContextMenu(null)}
              onResize={(size) => handleResizeWidget(placed.instanceId, size)}
              onRemove={() => handleRemoveWidget(placed.instanceId)}
            />
          );
        })()}

      <WidgetGallery
        open={widgetGalleryOpen}
        onClose={() => setWidgetGalleryOpen(false)}
        onPlaceWidget={handlePlaceWidget}
      />
    </div>
  );
}
