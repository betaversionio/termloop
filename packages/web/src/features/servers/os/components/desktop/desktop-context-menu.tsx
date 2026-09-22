import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";
import type { AppType } from "../../types/window";
import { WALLPAPERS } from "../../lib/wallpapers";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type MenuItem =
  | { kind: "action"; label: string; onClick: () => void }
  | { kind: "submenu"; label: string; items: SubMenuItem[] }
  | { kind: "separator" };

interface SubMenuItem {
  label: string;
  onClick: () => void;
  active?: boolean;
}

interface DesktopContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onOpenApp: (appType: AppType) => void;
  onChangeWallpaper: (id: string) => void;
  currentWallpaper: string;
  onEditWidgets: () => void;
}

/* ------------------------------------------------------------------ */
/*  Shared panel class + item classes                                  */
/* ------------------------------------------------------------------ */

const panelClass =
  "rounded-[8px] py-[5px] border-[0.5px] border-white/[0.13] shadow-[0_24px_60px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.2),inset_0_0.5px_0_rgba(255,255,255,0.08)] bg-[rgba(30,30,30,0.72)] backdrop-blur-[60px] backdrop-saturate-[1.7]";

const itemBase =
  "flex items-center mx-[4px] px-[10px] h-[24px] rounded-[5px] cursor-default select-none text-[13px] leading-[24px] tracking-[-0.08px] text-[rgba(255,255,255,0.88)] transition-colors duration-75";

const itemHover = "hover:bg-[#3478F6] hover:text-white";

/* ------------------------------------------------------------------ */
/*  Desktop Context Menu                                               */
/* ------------------------------------------------------------------ */

export function DesktopContextMenu({
  x,
  y,
  onClose,
  onOpenApp,
  onChangeWallpaper,
  currentWallpaper,
  onEditWidgets,
}: DesktopContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [submenuPos, setSubmenuPos] = useState<{ x: number; y: number } | null>(null);
  const timeoutRef = useRef<number>(0);
  const submenuTriggerRef = useRef<HTMLDivElement>(null);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        // Also check if click is inside the portal submenu
        const sub = document.getElementById("desktop-ctx-submenu");
        if (sub && sub.contains(e.target as Node)) return;
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const wallpaperItems: SubMenuItem[] = WALLPAPERS.map((wp) => ({
    label: wp.label,
    onClick: () => onChangeWallpaper(wp.id),
    active: wp.id === currentWallpaper,
  }));

  const items: MenuItem[] = [
    { kind: "action", label: "Open Finder", onClick: () => onOpenApp("file-manager") },
    { kind: "action", label: "Open Terminal", onClick: () => onOpenApp("terminal") },
    { kind: "action", label: "Open Browser", onClick: () => onOpenApp("browser") },
    { kind: "separator" },
    { kind: "action", label: "Activity Monitor", onClick: () => onOpenApp("monitor") },
    { kind: "action", label: "TextEdit", onClick: () => onOpenApp("notepad") },
    { kind: "separator" },
    { kind: "action", label: "Edit Widgets…", onClick: onEditWidgets },
    { kind: "submenu", label: "Change Wallpaper", items: wallpaperItems },
    { kind: "action", label: "Settings", onClick: () => onOpenApp("settings") },
  ];

  /* Position clamping */
  const menuH = items.reduce((h, it) => h + (it.kind === "separator" ? 9 : 28), 10);
  const ax = Math.min(x, globalThis.innerWidth - 240);
  const ay = Math.min(y, globalThis.innerHeight - menuH - 20);

  const enterSub = useCallback(
    (label: string, el: HTMLDivElement) => {
      clearTimeout(timeoutRef.current);
      setActiveSubmenu(label);
      // Calculate submenu position from trigger element
      const rect = el.getBoundingClientRect();
      const menuRight = rect.right;
      const openLeft = menuRight + 190 > globalThis.innerWidth;
      setSubmenuPos({
        x: openLeft ? rect.left - 190 : menuRight - 2,
        y: rect.top - 5,
      });
    },
    []
  );

  const leaveSub = useCallback(() => {
    timeoutRef.current = window.setTimeout(() => {
      setActiveSubmenu(null);
      setSubmenuPos(null);
    }, 180);
  }, []);

  const cancelLeave = useCallback(() => {
    clearTimeout(timeoutRef.current);
  }, []);

  return (
    <>
      <div
        ref={ref}
        className={`fixed z-[10000] min-w-[230px] ${panelClass}`}
        style={{ left: ax, top: ay }}
      >
        {items.map((it, i) => {
          if (it.kind === "separator") {
            return (
              <div
                key={`s${i}`}
                className="my-[4px] mx-[10px] h-px bg-white/[0.1]"
              />
            );
          }

          if (it.kind === "submenu") {
            const open = activeSubmenu === it.label;
            return (
              <div
                key={it.label}
                ref={submenuTriggerRef}
                onMouseEnter={(e) => enterSub(it.label, e.currentTarget)}
                onMouseLeave={leaveSub}
              >
                <div
                  className={`${itemBase} justify-between ${
                    open ? "bg-[#3478F6] text-white" : itemHover
                  }`}
                >
                  <span>{it.label}</span>
                  <ChevronRight className="h-3 w-3 opacity-60" />
                </div>
              </div>
            );
          }

          return (
            <div
              key={it.label}
              className={`${itemBase} ${itemHover}`}
              onClick={() => {
                it.onClick();
                onClose();
              }}
            >
              {it.label}
            </div>
          );
        })}
      </div>

      {/* Submenu rendered via portal so backdrop-filter works independently */}
      {activeSubmenu && submenuPos &&
        createPortal(
          <Submenu
            items={wallpaperItems}
            pos={submenuPos}
            onClose={onClose}
            onMouseEnter={cancelLeave}
            onMouseLeave={leaveSub}
          />,
          document.body
        )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Submenu (rendered as portal)                                       */
/* ------------------------------------------------------------------ */

function Submenu({
  items,
  pos,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  items: SubMenuItem[];
  pos: { x: number; y: number };
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div
      id="desktop-ctx-submenu"
      className={`fixed z-[10001] min-w-[190px] max-h-[360px] overflow-y-auto ${panelClass}`}
      style={{ left: pos.x, top: pos.y }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={`${itemBase} ${itemHover} gap-2`}
          style={item.active ? { fontWeight: 500, color: "#5AC8FA" } : undefined}
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.active && <span className="text-[11px] -ml-1">✓</span>}
          {item.label}
        </div>
      ))}
    </div>
  );
}
