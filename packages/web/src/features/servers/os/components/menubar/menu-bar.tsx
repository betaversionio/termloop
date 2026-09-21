import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWindowManager } from "../../context/window-manager-context";
import { appRegistry, MENU_BAR_HEIGHT } from "../../lib/os-constants";
import { TaskbarClock } from "../taskbar/taskbar-clock";

export function MenuBar() {
  const navigate = useNavigate();
  const { state } = useWindowManager();

  const activeWindow = state.windows
    .filter((w) => !w.minimized)
    .sort((a, b) => b.zIndex - a.zIndex)[0];
  const activeApp = activeWindow ? appRegistry.get(activeWindow.appType) : undefined;

  return (
    <div
      className="fixed top-0 left-0 right-0 flex items-center justify-between select-none"
      style={{
        height: MENU_BAR_HEIGHT,
        zIndex: 9999,
        background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
        backdropFilter: "blur(60px) saturate(2.2)",
        WebkitBackdropFilter: "blur(60px) saturate(2.2)",
        boxShadow: "inset 0 -0.5px 0 rgba(255,255,255,0.12), 0 1px 12px rgba(0,0,0,0.2)",
      }}
    >
      <div className="flex items-center gap-2.5 pl-2.5 min-w-0">
        <button
          onClick={() => navigate(-1)}
          className="flex h-5 w-5 items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/[0.12] transition-colors duration-100"
          title="Exit OS view"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        {activeApp && (
          <span className="text-[13px] font-semibold text-white/95 truncate">
            {activeApp.title}
          </span>
        )}
      </div>

      <div className="pr-3">
        <TaskbarClock />
      </div>
    </div>
  );
}
