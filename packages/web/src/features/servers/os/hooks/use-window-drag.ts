import { useCallback, useRef } from "react";
import type { WindowState } from "../types/window";
import { useWindowManager } from "../context/window-manager-context";
import { MENU_BAR_HEIGHT } from "../lib/os-constants";

export function useWindowDrag(window: WindowState) {
  const { dispatch } = useWindowManager();
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (window.maximized) return;
      dragging.current = true;
      offset.current = {
        x: e.clientX - window.bounds.x,
        y: e.clientY - window.bounds.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dispatch({ type: "FOCUS", id: window.id });
    },
    [window.id, window.bounds.x, window.bounds.y, window.maximized, dispatch]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const x = e.clientX - offset.current.x;
      const y = e.clientY - offset.current.y;
      // Clamp so at least 100px of the title bar is visible, and never let it go up
      // under the menu bar (which renders above every window and would hide the
      // window's own close/minimize/maximize controls).
      const clampedX = Math.max(-window.bounds.width + 100, Math.min(x, globalThis.innerWidth - 100));
      const clampedY = Math.max(MENU_BAR_HEIGHT, Math.min(y, globalThis.innerHeight - 100));
      dispatch({ type: "MOVE", id: window.id, x: clampedX, y: clampedY });
    },
    [window.id, window.bounds.width, dispatch]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const onDoubleClick = useCallback(() => {
    if (window.maximized) {
      dispatch({ type: "RESTORE", id: window.id });
    } else {
      dispatch({ type: "MAXIMIZE", id: window.id });
    }
  }, [window.id, window.maximized, dispatch]);

  return { onPointerDown, onPointerMove, onPointerUp, onDoubleClick };
}
