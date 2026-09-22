import { useState } from "react";
import { appRegistry } from "../../lib/os-constants";
import type { AppType } from "../../types/window";
import { cn } from "@/lib/utils";

interface DockIconProps {
  appType: AppType;
  isRunning: boolean;
  isActive: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  draggable?: boolean;
  /** This icon is the one currently being dragged (source). */
  isDragging?: boolean;
  /** A dragged icon is currently hovering over this one (drop target). */
  isDropTarget?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}

export function DockIcon({
  appType,
  isRunning,
  isActive,
  onClick,
  onContextMenu,
  draggable,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: DockIconProps) {
  const app = appRegistry.get(appType);
  if (!app) return null;
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "relative flex items-center justify-center outline-none w-[60px] h-[50px] transition-[opacity,transform]",
        isDragging && "opacity-30",
        isDropTarget && "scale-110"
      )}
    >
      {/* Tooltip — cleared generously above the icon's own max hover-magnified extent
          (scale-[1.22] + -translate-y-3 lifts its top ~17.5px above rest), not just its
          resting position, so it never collides with the enlarged icon. */}
      <div
        className={cn(
          "absolute -top-[58px] px-[11px] py-[5px] rounded-[10px] text-[12.5px] font-medium text-white whitespace-nowrap pointer-events-none transition-opacity duration-100",
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.05)_100%),rgba(30,30,30,0.6)]",
          "backdrop-blur-[40px] backdrop-saturate-[2.2]",
          "shadow-[0_0_0_0.5px_rgba(255,255,255,0.2),0_8px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.15)]",
          hovered ? "opacity-100" : "opacity-0"
        )}
      >
        {app.title}
        {/* Downward-pointing arrow — same glass fill, tucked half under the tooltip's
            rounded bottom edge so it reads as one continuous speech-bubble shape. */}
        <div
          className={cn(
            "absolute -bottom-[4px] left-1/2 -translate-x-1/2 rotate-45 w-2 h-2 rounded-br-[2px]",
            "bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.14)_100%),rgba(30,30,30,0.6)]",
            "shadow-[1px_1px_0_0.5px_rgba(255,255,255,0.2)]"
          )}
        />
      </div>

      {/* Icon with mac-style magnification — overflows above the dock on hover, not
          reserved for inside a taller box, matching real macOS Dock behavior. */}
      <img
        src={app.iconUrl}
        alt={app.title}
        className={cn(
          "rounded-[13px] w-[50px] h-[50px] transition-transform duration-150 ease-out",
          hovered
            ? "scale-[1.22] -translate-y-3 drop-shadow-[0_10px_14px_rgba(0,0,0,0.35)]"
            : "scale-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
        )}
        draggable={false}
      />

      {/* Running dot — overlaid just below the icon, doesn't add its own layout height */}
      {isRunning && (
        <div
          className={cn(
            "absolute -bottom-[7px] w-[5px] h-[5px] rounded-full",
            isActive ? "bg-white/95" : "bg-white/50"
          )}
        />
      )}
    </button>
  );
}
