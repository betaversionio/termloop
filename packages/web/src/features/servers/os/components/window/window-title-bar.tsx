import type { WindowState } from "../../types/window";
import { useWindowDrag } from "../../hooks/use-window-drag";
import { TrafficLights } from "./window-traffic-lights";

interface WindowTitleBarProps {
  window: WindowState;
  onClose?: () => void;
}

export function WindowTitleBar({ window: win, onClose }: WindowTitleBarProps) {
  const { onPointerDown, onPointerMove, onPointerUp, onDoubleClick } = useWindowDrag(win);

  return (
    <div
      className="relative flex h-9 shrink-0 items-center bg-card border-b border-border select-none touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      <div className="pl-3 z-10">
        <TrafficLights window={win} onClose={onClose} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-24 pointer-events-none">
        <span className="text-xs font-medium truncate text-foreground/90">{win.title}</span>
      </div>
    </div>
  );
}
