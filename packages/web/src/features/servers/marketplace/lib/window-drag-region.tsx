import { useWindowManager } from "@/features/servers/os/context/window-manager-context";
import { useWindowDrag } from "@/features/servers/os/hooks/use-window-drag";
import type { WindowState } from "@/features/servers/os/types/window";

interface WindowDragRegionProps {
  windowId: string;
  className?: string;
  children?: React.ReactNode;
}

// Only used when `windowId` doesn't (yet) match a real window — shouldn't happen in
// practice since a mounted app's windowId always refers to its own existing window,
// but useWindowDrag must always receive a well-formed WindowState (its dependency
// arrays read window.bounds.x/y directly) since hooks can't be called conditionally.
const FALLBACK_WINDOW: WindowState = {
  id: "",
  appType: "terminal",
  title: "",
  bounds: { x: 0, y: 0, width: 0, height: 0 },
  prevBounds: null,
  minimized: false,
  maximized: false,
  zIndex: 0,
  minWidth: 0,
  minHeight: 0,
};

/** Exposed to marketplace apps as `sdk.ui.WindowDragRegion` — only needed with
 * `titleBarStyle: "custom"`, where the host no longer owns a full-width title bar
 * to drag from. Wraps `useWindowDrag`, the same hook the host's own default title
 * bar uses, so the behavior (drag, double-click-to-maximize) is identical. */
export function WindowDragRegion({ windowId, className, children }: WindowDragRegionProps) {
  const { state } = useWindowManager();
  const win = state.windows.find((w) => w.id === windowId);
  const drag = useWindowDrag(win ?? FALLBACK_WINDOW);

  if (!win) return <div className={className}>{children}</div>;

  return (
    <div
      className={className}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onDoubleClick={drag.onDoubleClick}
    >
      {children}
    </div>
  );
}
