import { useRef, useState } from "react";
import { appRegistry } from "../../lib/os-constants";
import type { AppType } from "../../types/window";
import { cn } from "@/lib/utils";
import { DockTooltip } from "./dock-tooltip";

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
  onDrop?: (e: React.DragEvent) => void;
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
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={(e) => {
        // Stops this from also bubbling up to the dock pill's own onDrop (which
        // handles dropping on empty dock space) and double-inserting the app.
        e.stopPropagation();
        onDrop?.(e);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "relative flex items-center justify-center outline-none w-[60px] h-[50px] transition-[opacity,transform]",
        isDragging && "opacity-30",
        isDropTarget && "scale-110"
      )}
    >
      <DockTooltip label={app.title} hovered={hovered} anchorRef={buttonRef} />

      {/* Icon with mac-style magnification — overflows above the dock on hover, not
          reserved for inside a taller box, matching real macOS Dock behavior.
          No draggable={false} — that would block dragstart from ever firing when
          the cursor is over it (the dominant hit-area), overriding the button's own
          draggable=true per the HTML5 DnD spec. */}
      <img
        src={app.iconUrl}
        alt={app.title}
        className={cn(
          "rounded-[13px] w-[50px] h-[50px] transition-transform duration-150 ease-out",
          hovered
            ? "scale-[1.22] -translate-y-3 drop-shadow-[0_10px_14px_rgba(0,0,0,0.35)]"
            : "scale-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
        )}
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
