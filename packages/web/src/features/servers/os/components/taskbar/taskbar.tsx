import { useWindowManager } from "../../context/window-manager-context";
import { useMarketplace } from "@/features/servers/marketplace/components/marketplace-context";
import { TASKBAR_HEIGHT } from "../../lib/os-constants";
import type { AppType } from "../../types/window";
import { DockIcon } from "./dock-icon";

export function Taskbar() {
  const { state, dispatch } = useWindowManager();
  const { dockApps } = useMarketplace();

  const activeAppType = state.windows
    .filter((w) => !w.minimized)
    .sort((a, b) => b.zIndex - a.zIndex)[0]?.appType;

  const handleAppClick = (appType: AppType) => {
    const wins = state.windows.filter((w) => w.appType === appType);

    if (wins.length === 0) {
      dispatch({ type: "OPEN", appType });
      return;
    }

    const visible = wins.filter((w) => !w.minimized);
    if (visible.length === 0) {
      const latest = wins.sort((a, b) => b.zIndex - a.zIndex)[0];
      dispatch({ type: "RESTORE", id: latest.id });
      return;
    }

    const topWin = state.windows
      .filter((w) => !w.minimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0];

    if (topWin && topWin.appType === appType) {
      dispatch({ type: "MINIMIZE", id: topWin.id });
    } else {
      const latest = visible.sort((a, b) => b.zIndex - a.zIndex)[0];
      dispatch({ type: "FOCUS", id: latest.id });
    }
  };

  const runningTypes = [...new Set(state.windows.map((w) => w.appType))];
  // Pinned apps show even when closed (like a real dock); anything running but not
  // pinned gets appended after a divider, matching macOS's temporary-dock-icon behavior.
  const extraRunning = runningTypes.filter((t) => !dockApps.includes(t));

  return (
    <div
      className="fixed bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-[6px] px-2 rounded-2xl border border-white/[0.1]"
      style={{
        height: TASKBAR_HEIGHT,
        zIndex: 9999,
        backgroundColor: "rgba(20, 20, 20, 0.55)",
        backdropFilter: "blur(50px) saturate(1.7)",
        WebkitBackdropFilter: "blur(50px) saturate(1.7)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.35), inset 0 0.5px 0 rgba(255,255,255,0.08)",
      }}
    >
      {dockApps.map((appType) => (
        <DockIcon
          key={appType}
          appType={appType}
          isRunning={runningTypes.includes(appType)}
          isActive={appType === activeAppType}
          onClick={() => handleAppClick(appType)}
        />
      ))}

      {extraRunning.length > 0 && <div className="self-center w-px h-8 mx-1 bg-white/[0.15]" />}

      {extraRunning.map((appType) => (
        <DockIcon
          key={appType}
          appType={appType}
          isRunning={true}
          isActive={appType === activeAppType}
          onClick={() => handleAppClick(appType)}
        />
      ))}
    </div>
  );
}
