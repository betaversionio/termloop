import { useRef, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { DockTooltip } from "./dock-tooltip";

interface LaunchpadIconProps {
  onClick: () => void;
}

/** Dock trigger for the Launchpad overlay — same tile/tooltip/magnify treatment as
 * DockIcon, but for a fixed action rather than an app in the registry. */
export function LaunchpadIcon({ onClick }: LaunchpadIconProps) {
  const [hovered, setHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center justify-center outline-none w-[60px] h-[50px]"
    >
      <DockTooltip label="Launchpad" hovered={hovered} anchorRef={buttonRef} />

      <div
        className={cn(
          "flex items-center justify-center rounded-[13px] w-[50px] h-[50px] bg-white/[0.08] transition-transform duration-150 ease-out",
          hovered
            ? "scale-[1.22] -translate-y-3 drop-shadow-[0_10px_14px_rgba(0,0,0,0.35)]"
            : "scale-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
        )}
      >
        <LayoutGrid className="h-6 w-6 text-white/90" strokeWidth={1.75} />
      </div>
    </button>
  );
}
