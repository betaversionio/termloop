import { useCallback, useRef } from "react";
import type { WindowState } from "../types/window";
import { useWindowManager } from "../context/window-manager-context";
import { MENU_BAR_HEIGHT } from "../lib/os-constants";

type ResizeEdge =
  | "n" | "s" | "e" | "w"
  | "ne" | "nw" | "se" | "sw";

export function useWindowResize(window: WindowState) {
  const { dispatch } = useWindowManager();
  const resizing = useRef<ResizeEdge | null>(null);
  const startBounds = useRef(window.bounds);
  const startPos = useRef({ x: 0, y: 0 });

  const onResizeStart = useCallback(
    (edge: ResizeEdge, e: React.PointerEvent) => {
      if (window.maximized) return;
      e.preventDefault();
      e.stopPropagation();
      resizing.current = edge;
      startBounds.current = { ...window.bounds };
      startPos.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [window.bounds, window.maximized]
  );

  const onResizeMove = useCallback(
    (e: React.PointerEvent) => {
      const edge = resizing.current;
      if (!edge) return;

      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      const b = startBounds.current;
      const newBounds = { ...b };

      if (edge.includes("e")) {
        newBounds.width = Math.max(window.minWidth, b.width + dx);
      }
      if (edge.includes("w")) {
        const w = Math.max(window.minWidth, b.width - dx);
        newBounds.x = b.x + (b.width - w);
        newBounds.width = w;
      }
      if (edge.includes("s")) {
        newBounds.height = Math.max(window.minHeight, b.height + dy);
      }
      if (edge.includes("n")) {
        const h = Math.max(window.minHeight, b.height - dy);
        const newY = b.y + (b.height - h);
        // Don't let the top edge go up under the menu bar — clamp there and keep the
        // bottom edge fixed instead, same as hitting minHeight.
        if (newY < MENU_BAR_HEIGHT) {
          newBounds.y = MENU_BAR_HEIGHT;
          newBounds.height = b.y + b.height - MENU_BAR_HEIGHT;
        } else {
          newBounds.y = newY;
          newBounds.height = h;
        }
      }

      dispatch({ type: "RESIZE", id: window.id, bounds: newBounds });
    },
    [window.id, window.minWidth, window.minHeight, dispatch]
  );

  const onResizeEnd = useCallback(() => {
    resizing.current = null;
  }, []);

  return { onResizeStart, onResizeMove, onResizeEnd };
}

export const RESIZE_EDGES: { edge: ResizeEdge; className: string; cursor: string }[] = [
  { edge: "n", className: "absolute -top-1 left-2 right-2 h-2", cursor: "n-resize" },
  { edge: "s", className: "absolute -bottom-1 left-2 right-2 h-2", cursor: "s-resize" },
  { edge: "e", className: "absolute top-2 -right-1 bottom-2 w-2", cursor: "e-resize" },
  { edge: "w", className: "absolute top-2 -left-1 bottom-2 w-2", cursor: "w-resize" },
  { edge: "ne", className: "absolute -top-1 -right-1 h-3 w-3", cursor: "ne-resize" },
  { edge: "nw", className: "absolute -top-1 -left-1 h-3 w-3", cursor: "nw-resize" },
  { edge: "se", className: "absolute -bottom-1 -right-1 h-3 w-3", cursor: "se-resize" },
  { edge: "sw", className: "absolute -bottom-1 -left-1 h-3 w-3", cursor: "sw-resize" },
];
