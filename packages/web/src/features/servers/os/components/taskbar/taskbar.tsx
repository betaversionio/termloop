import { useWindowManager } from "../../context/window-manager-context";
import { useMarketplace } from "@/features/servers/marketplace/components/marketplace-context";
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
      className="fixed bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-[4px] px-[10px] py-[9px] rounded-[24px]"
      style={{
        zIndex: 9999,
        overflow: "visible",
        background: "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)",
        backdropFilter: "blur(36px) saturate(2.2)",
        WebkitBackdropFilter: "blur(36px) saturate(2.2)",
        boxShadow:
          "0 0 0 0.5px rgba(255,255,255,0.2), 0 20px 45px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.15)",
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

      {extraRunning.length > 0 && <div className="self-stretch w-px my-2 bg-white/[0.18]" />}

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
