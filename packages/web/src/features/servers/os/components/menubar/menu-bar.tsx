import { useCallback, useEffect, useState } from "react";
import { Minimize2, Maximize2 } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useWindowManager } from "../../context/window-manager-context";
import { appRegistry, MENU_BAR_HEIGHT } from "../../lib/os-constants";
import { TaskbarClock } from "../taskbar/taskbar-clock";
import { cn } from "@/lib/utils";

export function MenuBar() {
  const router = useRouter();
  const { state } = useWindowManager();

  // Real browser Fullscreen API — takes over the whole physical screen (hides browser
  // chrome/tabs too), separate from our in-app "maximize" which stays inside the tab.
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const onChange = () => setIsBrowserFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleBrowserFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const topWindow = state.windows
    .filter((w) => !w.minimized)
    .sort((a, b) => b.zIndex - a.zIndex)[0];
  const activeApp = topWindow ? appRegistry.get(topWindow.appType) : undefined;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between select-none",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%),rgba(22,22,24,0.55)]",
        "backdrop-blur-[16px] backdrop-saturate-[1.8]",
        "shadow-[inset_0_-0.5px_0_rgba(255,255,255,0.12),0_1px_12px_rgba(0,0,0,0.2)]"
      )}
      // MENU_BAR_HEIGHT is a shared JS constant (also used for layout math elsewhere),
      // not a design token — Tailwind can't statically pick up an interpolated
      // arbitrary-value class, so height stays a genuine inline style.
      style={{ height: MENU_BAR_HEIGHT }}
    >
      <div className="flex items-center gap-2.5 pl-2.5 min-w-0">
        <button
          onClick={() => router.history.back()}
          className="flex h-7 w-7 items-center justify-center rounded text-white hover:bg-white/[0.12] transition-colors duration-100"
          title="Exit OS view"
        >
          <span
            className="block h-5 w-5 bg-current"
            style={{
              WebkitMaskImage: "url(/icon.svg)",
              maskImage: "url(/icon.svg)",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        </button>
        {activeApp && (
          <span className="text-[13px] font-semibold text-white/95 truncate">
            {activeApp.title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 pr-3">
        <button
          onClick={toggleBrowserFullscreen}
          className="flex h-5 w-5 items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/[0.12] transition-colors duration-100"
          title={isBrowserFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
        >
          {isBrowserFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
        <TaskbarClock />
      </div>
    </div>
  );
}
