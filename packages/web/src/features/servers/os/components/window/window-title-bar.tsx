import { useCallback } from "react";
import { X, Minus, Maximize2, Minimize2 } from "lucide-react";
import type { WindowState } from "../../types/window";
import { useWindowManager } from "../../context/window-manager-context";
import { useWindowDrag } from "../../hooks/use-window-drag";

interface WindowTitleBarProps {
  window: WindowState;
  onClose?: () => void;
}

interface TrafficLightProps {
  color: string;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
}

function TrafficLight({ color, onClick, title, children }: TrafficLightProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-[13px] w-[13px] items-center justify-center rounded-full transition-[filter] duration-100 hover:brightness-90"
      style={{ backgroundColor: color, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.15)" }}
    >
      <span className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-100 [&>svg]:h-[8px] [&>svg]:w-[8px]">
        {children}
      </span>
    </button>
  );
}

export function WindowTitleBar({ window: win, onClose }: WindowTitleBarProps) {
  const { dispatch } = useWindowManager();
  const { onPointerDown, onPointerMove, onPointerUp, onDoubleClick } = useWindowDrag(win);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onClose) onClose();
      else dispatch({ type: "CLOSE", id: win.id });
    },
    [onClose, dispatch, win.id]
  );

  const handleMinimize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({ type: "MINIMIZE", id: win.id });
    },
    [dispatch, win.id]
  );

  const handleZoom = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (win.maximized) dispatch({ type: "RESTORE", id: win.id });
      else dispatch({ type: "MAXIMIZE", id: win.id });
    },
    [dispatch, win.id, win.maximized]
  );

  return (
    <div
      className="relative flex h-9 shrink-0 items-center bg-card border-b border-border select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
      style={{ touchAction: "none" }}
    >
      <div className="group flex items-center gap-2 pl-3 z-10">
        <TrafficLight color="#ff5f57" onClick={handleClose} title="Close">
          <X strokeWidth={3} />
        </TrafficLight>
        <TrafficLight color="#febc2e" onClick={handleMinimize} title="Minimize">
          <Minus strokeWidth={3} />
        </TrafficLight>
        <TrafficLight color="#28c840" onClick={handleZoom} title={win.maximized ? "Restore" : "Zoom"}>
          {win.maximized ? <Minimize2 strokeWidth={3} /> : <Maximize2 strokeWidth={3} />}
        </TrafficLight>
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-24 pointer-events-none">
        <span className="text-xs font-medium truncate text-foreground/90">{win.title}</span>
      </div>
    </div>
  );
}
