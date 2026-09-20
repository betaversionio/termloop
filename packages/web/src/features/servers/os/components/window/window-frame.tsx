import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import type { WindowState } from "../../types/window";
import { useWindowManager } from "../../context/window-manager-context";
import { useWindowResize, RESIZE_EDGES } from "../../hooks/use-window-resize";
import { WindowTitleBar } from "./window-title-bar";
import { TASKBAR_HEIGHT, MENU_BAR_HEIGHT } from "../../lib/os-constants";
import { cn } from "@/lib/utils";

interface WindowFrameProps {
  window: WindowState;
  children: ReactNode;
}

export function WindowFrame({ window: win, children }: WindowFrameProps) {
  const { dispatch } = useWindowManager();
  const { onResizeStart, onResizeMove, onResizeEnd } = useWindowResize(win);
  const containerRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [opening, setOpening] = useState(true);

  // Remove the open animation class after it plays so it doesn't interfere with transforms
  useEffect(() => {
    if (opening) {
      const timer = setTimeout(() => setOpening(false), 200);
      return () => clearTimeout(timer);
    }
  }, [opening]);

  const handleClose = useCallback(() => {
    setClosing(true);
  }, []);

  const onAnimationEnd = useCallback(() => {
    if (closing) {
      dispatch({ type: "CLOSE", id: win.id });
    }
  }, [closing, dispatch, win.id]);

  const style: React.CSSProperties = win.minimized
    ? { position: "absolute", left: 0, top: 0, width: 0, height: 0, overflow: "hidden", pointerEvents: "none", opacity: 0 }
    : win.maximized
      ? { position: "absolute", top: MENU_BAR_HEIGHT, left: 0, right: 0, bottom: TASKBAR_HEIGHT, zIndex: win.zIndex }
      : {
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate3d(${win.bounds.x}px, ${win.bounds.y}px, 0)`,
          width: win.bounds.width,
          height: win.bounds.height,
          zIndex: win.zIndex,
        };

  return (
    <div
      ref={containerRef}
      style={style}
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card shadow-xl overflow-hidden",
        win.maximized && "rounded-none",
        !win.minimized && opening && "animate-window-open",
        closing && "animate-window-close",
      )}
      onPointerDown={() => dispatch({ type: "FOCUS", id: win.id })}
      onAnimationEnd={onAnimationEnd}
    >
      <WindowTitleBar window={win} onClose={handleClose} />
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Resize handles */}
      {!win.maximized &&
        RESIZE_EDGES.map(({ edge, className, cursor }) => (
          <div
            key={edge}
            className={className}
            style={{ cursor, zIndex: 50 }}
            onPointerDown={(e) => onResizeStart(edge as any, e)}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
          />
        ))}
    </div>
  );
}
