import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useWindowManager } from '../../context/window-manager-context';
import { useMarketplace } from '@/features/servers/marketplace/components/marketplace-context';
import { appRegistry, type AppDefinition } from '../../lib/os-constants';
import type { AppType } from '../../types/window';

const DRAG_THRESHOLD = 6;

interface LaunchpadProps {
  open: boolean;
  onClose: () => void;
  /** The Dock pill's DOM node — used to hit-test where a tile was dropped. */
  dockRef: RefObject<HTMLDivElement | null>;
  /** Called when a tile is dropped on the Dock. */
  onDropOnDock: (appType: AppType) => void;
}

/** A mac-Launchpad-style overlay for discovering and launching every installed app
 * (built-in + marketplace), regardless of whether it's pinned to the Dock. */
export function Launchpad({ open, onClose, dockRef, onDropOnDock }: LaunchpadProps) {
  const { dispatch } = useWindowManager();
  const { installedApps } = useMarketplace();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const apps = useMemo(() => {
    // installedApps isn't read directly — appRegistry (a mutable Map) is the actual
    // source, but it's kept in sync with installedApps, so depending on it here is what
    // makes this recompute when a marketplace app is installed/uninstalled.
    void installedApps;
    const all = Array.from(appRegistry.values());
    const q = query.trim().toLowerCase();
    const filtered = q
      ? all.filter((a) => a.title.toLowerCase().includes(q))
      : all;
    return filtered.sort((a, b) => a.title.localeCompare(b.title));
  }, [query, installedApps]);

  const handleOpen = (appType: AppType) => {
    dispatch({ type: 'OPEN', appType });
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center bg-black/40 backdrop-blur-[60px] backdrop-saturate-[1.8] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder="Search"
        className="mt-20 w-[420px] rounded-[20px] bg-white/10 border border-white/15 px-5 py-3 text-base text-white placeholder:text-white/50 outline-none focus:bg-white/15 transition-colors"
      />

      <div
        className="mt-12 grid gap-x-6 gap-y-8 max-w-[900px] w-full px-10 overflow-y-auto pb-20"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {apps.map((app) => (
          <LaunchpadTile
            key={app.type}
            app={app}
            onOpen={handleOpen}
            dockRef={dockRef}
            onDropOnDock={(appType) => {
              onDropOnDock(appType);
              onClose();
            }}
          />
        ))}

        {apps.length === 0 && (
          <p className="col-span-full text-center text-sm text-white/50 mt-8">
            No apps found
          </p>
        )}
      </div>
    </div>
  );
}

interface LaunchpadTileProps {
  app: AppDefinition;
  onOpen: (appType: AppType) => void;
  dockRef: RefObject<HTMLDivElement | null>;
  onDropOnDock: (appType: AppType) => void;
}

/** Hand-rolled pointer-based drag (same technique as desktop-icon.tsx's icon
 * dragging) instead of native HTML5 drag-and-drop — native DnD turned out unreliable
 * here across browsers (a short/quick drag gesture can get silently reinterpreted as
 * a plain click, which both failed to register the drop AND fired the tile's onClick,
 * closing Launchpad and opening the app). This gives full explicit control over what
 * counts as a drag vs. a click, with no browser heuristics involved. */
function LaunchpadTile({ app, onOpen, dockRef, onDropOnDock }: LaunchpadTileProps) {
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const elRef = useRef<HTMLButtonElement>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    didDrag.current = false;
    startPointer.current = { x: e.clientX, y: e.clientY };
    elRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startPointer.current.x;
    const dy = e.clientY - startPointer.current.y;
    if (!didDrag.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    didDrag.current = true;
    setGhostPos({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    elRef.current?.releasePointerCapture(e.pointerId);
    setGhostPos(null);

    if (didDrag.current) {
      // The ghost has pointer-events:none, so this correctly hits whatever is
      // actually underneath the cursor (a Dock icon or the pill itself).
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target && dockRef.current?.contains(target)) {
        onDropOnDock(app.type);
      }
    } else {
      onOpen(app.type);
    }
  };

  return (
    <>
      <button
        ref={elRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="flex flex-col items-center gap-2 group outline-none touch-none select-none"
      >
        <img
          src={app.iconUrl}
          alt={app.title}
          className="h-16 w-16 rounded-[16px] transition-transform duration-150 group-hover:scale-110 group-focus-visible:scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)] pointer-events-none"
          style={ghostPos ? { opacity: 0.3 } : undefined}
          draggable={false}
        />
        <span
          className="text-xs text-white text-center leading-tight max-w-full truncate px-1"
          style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}
        >
          {app.title}
        </span>
      </button>

      {ghostPos &&
        createPortal(
          <img
            src={app.iconUrl}
            alt=""
            className="rounded-[16px] drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
            style={{
              position: 'fixed',
              left: ghostPos.x - 32,
              top: ghostPos.y - 32,
              width: 64,
              height: 64,
              zIndex: 10000,
              pointerEvents: 'none',
            }}
          />,
          document.body
        )}
    </>
  );
}
