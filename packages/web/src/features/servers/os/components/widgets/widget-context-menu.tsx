import { useEffect, useRef } from "react";
import { panelClass, itemBase } from "../shared/context-menu-styles";
import type { MarketplaceWidget } from "@termloop/shared";
import type { WidgetSize } from "../../context/desktop-settings-context";

type MenuItem =
  | { kind: "action"; label: string; onClick: () => void; destructive?: boolean; disabled?: boolean }
  | { kind: "separator" };

const SIZE_LABELS: Record<WidgetSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

interface WidgetContextMenuProps {
  x: number;
  y: number;
  manifest: MarketplaceWidget;
  currentSize: WidgetSize;
  onClose: () => void;
  onResize: (size: WidgetSize) => void;
  onRemove: () => void;
}

export function WidgetContextMenu({
  x,
  y,
  manifest,
  currentSize,
  onClose,
  onResize,
  onRemove,
}: WidgetContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const sizes = Object.keys(manifest.sizes) as WidgetSize[];

  const items: MenuItem[] = [
    ...sizes.map((size): MenuItem => ({
      kind: "action",
      label: size === currentSize ? `✓ ${SIZE_LABELS[size]}` : SIZE_LABELS[size],
      onClick: () => onResize(size),
      disabled: size === currentSize,
    })),
    { kind: "separator" },
    { kind: "action", label: "Remove Widget", onClick: onRemove, destructive: true },
  ];

  const menuH = items.reduce((h, it) => h + (it.kind === "separator" ? 9 : 28), 44);
  const ax = Math.min(x, globalThis.innerWidth - 200);
  const ay = Math.min(y, globalThis.innerHeight - menuH - 20);

  return (
    <div ref={ref} className={`fixed z-[10000] min-w-[180px] ${panelClass}`} style={{ left: ax, top: ay }}>
      <div className="flex items-center gap-2 mx-[4px] px-[10px] h-[30px] text-[13px] font-medium text-white/90">
        <img src={manifest.iconUrl} alt="" className="h-4 w-4 rounded-[4px]" draggable={false} />
        {manifest.name}
      </div>
      <div className="my-[4px] mx-[10px] h-px bg-white/[0.1]" />

      {items.map((it, i) => {
        if (it.kind === "separator") {
          return <div key={`s${i}`} className="my-[4px] mx-[10px] h-px bg-white/[0.1]" />;
        }
        return (
          <div
            key={it.label + i}
            className={`${itemBase} ${
              it.disabled
                ? "text-white/40 pointer-events-none"
                : it.destructive
                  ? "text-[#FF6961] hover:bg-[#FF453A] hover:text-white"
                  : "text-[rgba(255,255,255,0.88)] hover:bg-[#3478F6] hover:text-white"
            }`}
            onClick={() => {
              if (it.disabled) return;
              it.onClick();
              onClose();
            }}
          >
            {it.label}
          </div>
        );
      })}
    </div>
  );
}
