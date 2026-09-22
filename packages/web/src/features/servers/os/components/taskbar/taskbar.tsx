import { useState } from 'react';
import { useWindowManager } from '../../context/window-manager-context';
import { useDesktopSettings } from '../../context/desktop-settings-context';
import { useDockApps } from '../../hooks/use-dock-apps';
import type { AppType } from '../../types/window';
import { DockIcon } from './dock-icon';
import { DockContextMenu } from './dock-context-menu';
import { LaunchpadIcon } from './launchpad-icon';
import { Launchpad } from '../launchpad/launchpad';
import { useEdgeReveal } from '../../hooks/use-edge-reveal';
import { cn } from '@/lib/utils';

export function Taskbar() {
  const { state, dispatch } = useWindowManager();
  const { setDockOrder } = useDesktopSettings();
  const dockApps = useDockApps();
  const [launchpadOpen, setLaunchpadOpen] = useState(false);
  const [draggedType, setDraggedType] = useState<AppType | null>(null);
  const [dragOverType, setDragOverType] = useState<AppType | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; appType: AppType } | null>(null);

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

  const handleDrop = (targetType: AppType) => {
    if (!draggedType || draggedType === targetType) {
      setDraggedType(null);
      setDragOverType(null);
      return;
    }
    const next = dockApps.filter((t) => t !== draggedType);
    const targetIndex = next.indexOf(targetType);
    next.splice(targetIndex, 0, draggedType);
    setDockOrder(next);
    setDraggedType(null);
    setDragOverType(null);
  };

  const handleFocusWindow = (id: string) => {
    const win = state.windows.find((w) => w.id === id);
    if (!win) return;
    dispatch({ type: win.minimized ? 'RESTORE' : 'FOCUS', id });
  };

  const handleQuit = (appType: AppType) => {
    for (const w of state.windows.filter((w) => w.appType === appType)) {
      dispatch({ type: 'CLOSE', id: w.id });
    }
  };

  const handlePin = (appType: AppType) => {
    if (!dockApps.includes(appType)) setDockOrder([...dockApps, appType]);
  };

  const handleUnpin = (appType: AppType) => {
    setDockOrder(dockApps.filter((t) => t !== appType));
  };

  return (
    // Launchpad renders as a sibling, not a child, of the dock pill below — the pill's own
    // -translate-x-1/2 transform would make it Launchpad's `fixed inset-0` containing block
    // instead of the viewport if nested inside it.
    <>
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
      <LaunchpadIcon onClick={() => setLaunchpadOpen(true)} />

      <div className="self-stretch w-px my-2 bg-white/[0.18]" />

      {dockApps.map((appType) => (
        <DockIcon
          key={appType}
          appType={appType}
          isRunning={runningTypes.includes(appType)}
          isActive={appType === activeAppType}
          onClick={() => handleAppClick(appType)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, appType });
          }}
          draggable
          isDragging={draggedType === appType}
          isDropTarget={dragOverType === appType && draggedType !== appType}
          onDragStart={() => setDraggedType(appType)}
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedType && draggedType !== appType) setDragOverType(appType);
          }}
          onDrop={() => handleDrop(appType)}
          onDragEnd={() => {
            setDraggedType(null);
            setDragOverType(null);
          }}
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
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, appType });
          }}
        />
      ))}
    </div>

    <Launchpad open={launchpadOpen} onClose={() => setLaunchpadOpen(false)} />

    {contextMenu && (
      <DockContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        appType={contextMenu.appType}
        windows={state.windows.filter((w) => w.appType === contextMenu.appType)}
        isPinned={dockApps.includes(contextMenu.appType)}
        onClose={() => setContextMenu(null)}
        onOpen={() => dispatch({ type: 'OPEN', appType: contextMenu.appType })}
        onFocusWindow={handleFocusWindow}
        onQuit={() => handleQuit(contextMenu.appType)}
        onPin={() => handlePin(contextMenu.appType)}
        onUnpin={() => handleUnpin(contextMenu.appType)}
      />
    )}
    </>
  );
}
