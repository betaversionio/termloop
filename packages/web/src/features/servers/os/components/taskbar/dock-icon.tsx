import { useState } from "react";
import { appRegistry } from "../../lib/os-constants";
import type { AppType } from "../../types/window";

interface DockIconProps {
  appType: AppType;
  isRunning: boolean;
  isActive: boolean;
  onClick: () => void;
}

export function DockIcon({ appType, isRunning, isActive, onClick }: DockIconProps) {
  const app = appRegistry.get(appType);
  if (!app) return null;
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center justify-center outline-none"
      style={{ width: 60, height: 50 }}
    >
      {/* Tooltip — cleared generously above the icon's own max hover-magnified extent
          (scale(1.22) + translateY(-12px) lifts its top ~17.5px above rest), not just
          its resting position, so it never collides with the enlarged icon. */}
      <div
        className="absolute -top-[58px] px-[10px] py-[5px] rounded-[7px] text-[12.5px] font-medium text-white whitespace-nowrap pointer-events-none transition-opacity duration-100"
        style={{
          opacity: hovered ? 1 : 0,
          backgroundColor: "rgba(30, 30, 30, 0.82)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "0.5px solid rgba(255,255,255,0.15)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        {app.title}
      </div>

      {/* Icon with mac-style magnification — overflows above the dock on hover, not
          reserved for inside a taller box, matching real macOS Dock behavior. */}
      <img
        src={app.iconUrl}
        alt={app.title}
        className="rounded-[13px] transition-transform duration-150 ease-out"
        style={{
          width: 50,
          height: 50,
          transform: hovered ? "scale(1.22) translateY(-12px)" : "scale(1)",
          filter: hovered ? "drop-shadow(0 10px 14px rgba(0,0,0,0.35))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
        }}
        draggable={false}
      />

      {/* Running dot — overlaid just below the icon, doesn't add its own layout height */}
      {isRunning && (
        <div
          className="absolute rounded-full"
          style={{
            bottom: -7,
            width: 5,
            height: 5,
            backgroundColor: isActive
              ? "rgba(255, 255, 255, 0.95)"
              : "rgba(255, 255, 255, 0.5)",
          }}
        />
      )}
    </button>
  );
}
