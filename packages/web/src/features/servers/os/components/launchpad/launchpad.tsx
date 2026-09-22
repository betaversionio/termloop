import { useEffect, useMemo, useState } from 'react';
import { useWindowManager } from '../../context/window-manager-context';
import { useMarketplace } from '@/features/servers/marketplace/components/marketplace-context';
import { appRegistry } from '../../lib/os-constants';
import type { AppType } from '../../types/window';

interface LaunchpadProps {
  open: boolean;
  onClose: () => void;
}

/** A mac-Launchpad-style overlay for discovering and launching every installed app
 * (built-in + marketplace), regardless of whether it's pinned to the Dock. */
export function Launchpad({ open, onClose }: LaunchpadProps) {
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
          <button
            key={app.type}
            onClick={() => handleOpen(app.type)}
            className="flex flex-col items-center gap-2 group outline-none"
          >
            <img
              src={app.iconUrl}
              alt={app.title}
              className="h-16 w-16 rounded-[16px] transition-transform duration-150 group-hover:scale-110 group-focus-visible:scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
              draggable={false}
            />
            <span
              className="text-xs text-white text-center leading-tight max-w-full truncate px-1"
              style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}
            >
              {app.title}
            </span>
          </button>
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
