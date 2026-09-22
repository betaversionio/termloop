import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface LaunchpadIconProps {
  onClick: () => void;
}

/** Dock trigger for the Launchpad overlay — same tile/tooltip/magnify treatment as
 * DockIcon, but for a fixed action rather than an app in the registry. */
export function LaunchpadIcon({ onClick }: LaunchpadIconProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center justify-center outline-none w-[60px] h-[50px]"
    >
      <div
        className={cn(
          "absolute -top-[58px] px-[11px] py-[5px] rounded-[10px] text-[12.5px] font-medium text-white whitespace-nowrap pointer-events-none transition-opacity duration-100",
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.05)_100%),rgba(30,30,30,0.6)]",
          "backdrop-blur-[40px] backdrop-saturate-[2.2]",
          "shadow-[0_0_0_0.5px_rgba(255,255,255,0.2),0_8px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.15)]",
          hovered ? "opacity-100" : "opacity-0"
        )}
      >
        Launchpad
        <div
          className={cn(
            "absolute -bottom-[4px] left-1/2 -translate-x-1/2 rotate-45 w-2 h-2 rounded-br-[2px]",
            "bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.14)_100%),rgba(30,30,30,0.6)]",
            "shadow-[1px_1px_0_0.5px_rgba(255,255,255,0.2)]"
          )}
        />
      </div>

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
