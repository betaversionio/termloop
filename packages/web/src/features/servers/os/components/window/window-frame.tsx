import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import type { WindowState } from "../../types/window";
import { useWindowManager } from "../../context/window-manager-context";
import { useWindowResize, RESIZE_EDGES } from "../../hooks/use-window-resize";
import { WindowTitleBar } from "./window-title-bar";
import { TrafficLights } from "./window-traffic-lights";
import { MENU_BAR_HEIGHT } from "../../lib/os-constants";
import { cn } from "@/lib/utils";

interface WindowFrameProps {
  window: WindowState;
  children: ReactNode;
  /** "custom" (set by the app's manifest) renders only the floating traffic-light
   * buttons instead of the full title bar, leaving the rest of the space for the
   * app's own toolbar/tabs — see sdk.ui.WindowDragRegion for how it drags. */
  titleBarStyle?: "default" | "custom";
}

export function WindowFrame({ window: win, children, titleBarStyle = "default" }: WindowFrameProps) {
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
      // Fills the workspace below the menu bar (which — unlike the dock — stays
      // permanently visible, not hover-reveal, since it now shares vertical space
      // with this window's own always-visible title bar and the two would otherwise
      // fight over clicks near the top edge).
      ? { position: "absolute", top: MENU_BAR_HEIGHT, left: 0, right: 0, bottom: 0, zIndex: win.zIndex }
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
      {/* Unlike the OS menu bar (which hides and hover-reveals in full screen), the
          window's own title bar/traffic lights always stay visible — it's the only
          reliable way to close/minimize/restore this specific window. */}
      {titleBarStyle === "default" && <WindowTitleBar window={win} onClose={handleClose} />}

      {titleBarStyle === "custom" && (
        <div className="absolute top-0 left-0 h-9 z-20 flex items-center pl-2">
          <div className="rounded-full bg-black/20 backdrop-blur-sm px-2.5 py-1.5">
            <TrafficLights window={win} onClose={handleClose} />
          </div>
        </div>
      )}

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
