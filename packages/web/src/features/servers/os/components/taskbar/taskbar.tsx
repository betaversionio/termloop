import { useWindowManager } from '../../context/window-manager-context';
import { useMarketplace } from '@/features/servers/marketplace/components/marketplace-context';
import type { AppType } from '../../types/window';
import { DockIcon } from './dock-icon';
import { useEdgeReveal } from '../../hooks/use-edge-reveal';
import { cn } from '@/lib/utils';

export function Taskbar() {
  const { state, dispatch } = useWindowManager();
  const { dockApps } = useMarketplace();

  const topWindow = state.windows
    .filter((w) => !w.minimized)
    .sort((a, b) => b.zIndex - a.zIndex)[0];
  const activeAppType = topWindow?.appType;

  // True full screen (like real macOS) hides the dock, revealing it only when the
  // mouse touches the very bottom edge of the screen.
  const isFullscreenActive = topWindow?.maximized ?? false;
  // Keep-visible zone covers the dock's own rendered height (~76px) + its bottom margin.
  const revealed = useEdgeReveal('bottom', isFullscreenActive, 6, 100);
  const hidden = isFullscreenActive && !revealed;

  const handleAppClick = (appType: AppType) => {
    const wins = state.windows.filter((w) => w.appType === appType);

    if (wins.length === 0) {
      dispatch({ type: 'OPEN', appType });
      return;
    }

    const visible = wins.filter((w) => !w.minimized);
    if (visible.length === 0) {
      const latest = wins.sort((a, b) => b.zIndex - a.zIndex)[0];
      dispatch({ type: 'RESTORE', id: latest.id });
      return;
    }

    const topWin = state.windows
      .filter((w) => !w.minimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0];

    if (topWin && topWin.appType === appType) {
      dispatch({ type: 'MINIMIZE', id: topWin.id });
    } else {
      const latest = visible.sort((a, b) => b.zIndex - a.zIndex)[0];
      dispatch({ type: 'FOCUS', id: latest.id });
    }
  };

  const runningTypes = [...new Set(state.windows.map((w) => w.appType))];
  // Pinned apps show even when closed (like a real dock); anything running but not
  // pinned gets appended after a divider, matching macOS's temporary-dock-icon behavior.
  const extraRunning = runningTypes.filter((t) => !dockApps.includes(t));

  return (
    <div
      className={cn(
        'fixed bottom-3 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-[4px] px-[10px] py-[9px] rounded-[24px] overflow-visible',
        'bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.03)_100%),rgba(22,22,24,0.5)]',
        'backdrop-blur-[16px] backdrop-saturate-[1.8]',
        'shadow-[0_0_0_0.5px_rgba(255,255,255,0.2),0_20px_45px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(0,0,0,0.15)]',
        'transition-transform duration-200 ease-out',
        hidden && 'translate-y-[calc(100%+16px)]'
      )}
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

      {extraRunning.length > 0 && (
        <div className="self-stretch w-px my-2 bg-white/[0.18]" />
      )}

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
