import { useEffect, useRef } from "react";
import { appRegistry } from "../../lib/os-constants";
import type { AppType, WindowState } from "../../types/window";

type MenuItem =
  | { kind: "action"; label: string; onClick: () => void; destructive?: boolean }
  | { kind: "separator" };

interface DockContextMenuProps {
  x: number;
  y: number;
  appType: AppType;
  windows: WindowState[];
  isPinned: boolean;
  onClose: () => void;
  onOpen: () => void;
  onFocusWindow: (id: string) => void;
  onQuit: () => void;
  onPin: () => void;
  onUnpin: () => void;
}

const panelClass =
  "rounded-[8px] py-[5px] border-[0.5px] border-white/[0.13] shadow-[0_24px_60px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.2),inset_0_0.5px_0_rgba(255,255,255,0.08)] bg-[rgba(30,30,30,0.72)] backdrop-blur-[60px] backdrop-saturate-[1.7]";

const itemBase =
  "flex items-center mx-[4px] px-[10px] h-[24px] rounded-[5px] cursor-default select-none text-[13px] leading-[24px] tracking-[-0.08px] transition-colors duration-75";

export function DockContextMenu({
  x,
  y,
  appType,
  windows,
  isPinned,
  onClose,
  onOpen,
  onFocusWindow,
  onQuit,
  onPin,
  onUnpin,
}: DockContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const app = appRegistry.get(appType);

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

  if (!app) return null;

  const items: MenuItem[] = [
    ...windows.map((w): MenuItem => ({
      kind: "action",
      label: `${w.minimized ? "◻ " : "● "}${w.title}`,
      onClick: () => onFocusWindow(w.id),
    })),
    ...(windows.length > 0 ? [{ kind: "separator" } as MenuItem] : []),
    { kind: "action", label: windows.length > 0 ? "New Window" : "Open", onClick: onOpen },
    ...(windows.length > 0 ? [{ kind: "action", label: "Quit", onClick: onQuit, destructive: true } as MenuItem] : []),
    { kind: "separator" },
    isPinned
      ? { kind: "action", label: "Remove from Dock", onClick: onUnpin }
      : { kind: "action", label: "Keep in Dock", onClick: onPin },
  ];

  const menuH = items.reduce((h, it) => h + (it.kind === "separator" ? 9 : 28), 44);
  const ax = Math.min(x, globalThis.innerWidth - 220);
  const ay = Math.min(y, globalThis.innerHeight - menuH - 20);

  return (
    <div ref={ref} className={`fixed z-[10000] min-w-[200px] ${panelClass}`} style={{ left: ax, top: ay }}>
      <div className="flex items-center gap-2 mx-[4px] px-[10px] h-[30px] text-[13px] font-medium text-white/90">
        <img src={app.iconUrl} alt="" className="h-4 w-4 rounded-[4px]" draggable={false} />
        {app.title}
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
              it.destructive
                ? "text-[#FF6961] hover:bg-[#FF453A] hover:text-white"
                : "text-[rgba(255,255,255,0.88)] hover:bg-[#3478F6] hover:text-white"
            }`}
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
  );
}
