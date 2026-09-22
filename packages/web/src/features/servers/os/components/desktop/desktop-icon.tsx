import { useRef, useCallback } from "react";
import type { AppType } from "../../types/window";
import { appRegistry, MENU_BAR_HEIGHT } from "../../lib/os-constants";
import { useWindowManager } from "../../context/window-manager-context";
import { useDesktopSettings, type IconPosition } from "../../context/desktop-settings-context";

const GRID_CELL = 90; // snap grid size in px
const DRAG_THRESHOLD = 5; // px movement before we treat it as a drag

interface DesktopIconProps {
  appType: AppType;
  position: IconPosition;
  containerRect: DOMRect | null;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function DesktopIcon({ appType, position, containerRect, onContextMenu }: DesktopIconProps) {
  const { dispatch } = useWindowManager();
  const { setIconPosition } = useDesktopSettings();
  const app = appRegistry.get(appType);

  const dragging = useRef(false);
  const didDrag = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const elRef = useRef<HTMLButtonElement>(null);

  const snapToGrid = useCallback(
    (x: number, y: number): IconPosition => {
      const snappedX = Math.round(x / GRID_CELL) * GRID_CELL;
      const snappedY = Math.round(y / GRID_CELL) * GRID_CELL;

      if (!containerRect) return { x: snappedX, y: snappedY };

      const maxX = containerRect.width - GRID_CELL;
      const maxY = containerRect.height - GRID_CELL;
      return {
        x: Math.max(0, Math.min(snappedX, maxX)),
        // Never snap above the menu bar — it sits on top of the desktop and would
        // otherwise hide (or fight for clicks with) an icon dragged under it.
        y: Math.max(MENU_BAR_HEIGHT, Math.min(snappedY, maxY)),
      };
    },
    [containerRect],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      didDrag.current = false;
      startPointer.current = { x: e.clientX, y: e.clientY };
      startPos.current = { ...position };
      elRef.current?.setPointerCapture(e.pointerId);
    },
    [position],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !elRef.current) return;
      const dx = e.clientX - startPointer.current.x;
      const dy = e.clientY - startPointer.current.y;

      if (!didDrag.current && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      didDrag.current = true;

      const newX = startPos.current.x + dx;
      const newY = startPos.current.y + dy;
      elRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
    },
    [],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      elRef.current?.releasePointerCapture(e.pointerId);

      if (didDrag.current) {
        const dx = e.clientX - startPointer.current.x;
        const dy = e.clientY - startPointer.current.y;
        const snapped = snapToGrid(startPos.current.x + dx, startPos.current.y + dy);
        setIconPosition(appType, snapped);

        if (elRef.current) {
          elRef.current.style.transform = `translate(${snapped.x}px, ${snapped.y}px)`;
        }
      }
    },
    [appType, setIconPosition, snapToGrid],
  );

  if (!app) return null;

  return (
    <button
      ref={elRef}
      className="absolute flex flex-col items-center justify-start w-[86px] py-2 px-1 rounded-[3px] border border-transparent hover:bg-white/10 hover:border-white/20 active:bg-white/20 focus-visible:bg-white/10 focus-visible:border-white/25 transition-[background-color,border-color] cursor-default select-none outline-none touch-none"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e);
      }}
      onDoubleClick={() => {
        if (!didDrag.current) dispatch({ type: "OPEN", appType });
      }}
    >
      <img
        src={app.iconUrl}
        alt={app.title}
        className="h-12 w-12 shrink-0 pointer-events-none"
        draggable={false}
      />
      <span
        className="mt-1.5 text-xs leading-[15px] text-white text-center break-words max-w-full px-0.5 pointer-events-none"
        style={{
          textShadow:
            "1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.4)",
        }}
      >
        {app.title}
      </span>
    </button>
  );
}
