import { useRef, useCallback } from "react";
import type { MarketplaceWidget } from "@termloop/shared";
import { GRID_CELL, MENU_BAR_HEIGHT, TASKBAR_HEIGHT, WIDGET_GAP } from "../../lib/os-constants";
import { useDesktopSettings, type IconPosition, type PlacedWidget } from "../../context/desktop-settings-context";
import { WidgetHost } from "./widget-host";

const DRAG_THRESHOLD = 5;

interface WidgetFrameProps {
  placed: PlacedWidget;
  manifest: MarketplaceWidget;
  connectionId: string;
  containerRect: DOMRect | null;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function WidgetFrame({ placed, manifest, connectionId, containerRect, onContextMenu }: WidgetFrameProps) {
  const { placedWidgets, setPlacedWidgets } = useDesktopSettings();
  const dims = manifest.sizes[placed.size] ?? Object.values(manifest.sizes)[0]!;

  const dragging = useRef(false);
  const didDrag = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const elRef = useRef<HTMLDivElement>(null);

  const snapToGrid = useCallback(
    (x: number, y: number): IconPosition => {
      const snappedX = Math.round(x / GRID_CELL) * GRID_CELL;
      const snappedY = Math.round(y / GRID_CELL) * GRID_CELL;

      if (!containerRect) return { x: snappedX, y: snappedY };

      // Keep a WIDGET_GAP breathing margin from every screen edge (menu bar, dock,
      // left/right), same as the gap already visible between neighboring widgets.
      const minX = WIDGET_GAP;
      const maxX = containerRect.width - dims.width - WIDGET_GAP;
      const minY = MENU_BAR_HEIGHT + WIDGET_GAP;
      const maxY = containerRect.height - TASKBAR_HEIGHT - dims.height - WIDGET_GAP;
      return {
        x: Math.max(minX, Math.min(snappedX, maxX)),
        y: Math.max(minY, Math.min(snappedY, maxY)),
      };
    },
    [containerRect, dims.width, dims.height]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      didDrag.current = false;
      startPointer.current = { x: e.clientX, y: e.clientY };
      startPos.current = { ...placed.position };
      elRef.current?.setPointerCapture(e.pointerId);
    },
    [placed.position]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !elRef.current) return;
    const dx = e.clientX - startPointer.current.x;
    const dy = e.clientY - startPointer.current.y;

    if (!didDrag.current && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
    didDrag.current = true;

    const newX = startPos.current.x + dx;
    const newY = startPos.current.y + dy;
    elRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      elRef.current?.releasePointerCapture(e.pointerId);

      if (didDrag.current) {
        const dx = e.clientX - startPointer.current.x;
        const dy = e.clientY - startPointer.current.y;
        const snapped = snapToGrid(startPos.current.x + dx, startPos.current.y + dy);

        setPlacedWidgets(
          placedWidgets.map((w) => (w.instanceId === placed.instanceId ? { ...w, position: snapped } : w))
        );

        if (elRef.current) {
          elRef.current.style.transform = `translate(${snapped.x}px, ${snapped.y}px)`;
        }
      }
    },
    [placed.instanceId, placedWidgets, setPlacedWidgets, snapToGrid]
  );

  return (
    // Outer box is the drag/snap *footprint* — its edges can legitimately touch a
    // neighboring widget's footprint. The visible glass card is inset within it by
    // WIDGET_GAP/2 on every side, which is what actually creates the gap you see.
    <div
      ref={elRef}
      className="absolute touch-none select-none cursor-default"
      style={{
        transform: `translate(${placed.position.x}px, ${placed.position.y}px)`,
        width: dims.width,
        height: dims.height,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!didDrag.current) onContextMenu(e);
      }}
    >
      <div
        className="absolute rounded-[20px] overflow-hidden"
        style={{
          inset: WIDGET_GAP / 2,
          background: "linear-gradient(180deg,rgba(255,255,255,0.14) 0%,rgba(255,255,255,0.04) 100%),rgba(28,28,32,0.45)",
          backdropFilter: "blur(30px) saturate(1.8)",
          WebkitBackdropFilter: "blur(30px) saturate(1.8)",
          boxShadow:
            "0 0 0 0.5px rgba(255,255,255,0.16), 0 18px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.15)",
        }}
      >
        <WidgetHost manifest={manifest} connectionId={connectionId} size={placed.size} />
      </div>
    </div>
  );
}
