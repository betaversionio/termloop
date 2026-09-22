import { useEffect, useMemo, useState } from "react";
import { useWidgets } from "@/features/servers/marketplace/components/widgets-context";
import { useMarketplace } from "@/features/servers/marketplace/components/marketplace-context";
import type { MarketplaceWidget } from "@termloop/shared";

interface WidgetGalleryProps {
  open: boolean;
  onClose: () => void;
  onPlaceWidget: (manifest: MarketplaceWidget) => void;
}

/** A Launchpad-style overlay for discovering widgets — standalone ones first, then
 * ones bundled with an installed app, then locked ones bundled with an app that
 * isn't installed yet. */
export function WidgetGallery({ open, onClose, onPlaceWidget }: WidgetGalleryProps) {
  const { catalog, isLocked } = useWidgets();
  const { installedApps } = useMarketplace();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const appNameById = useMemo(
    () => new Map(installedApps.map((a) => [a.manifest.id, a.manifest.name])),
    [installedApps]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? catalog.filter((w) => w.name.toLowerCase().includes(q)) : catalog;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog, query]);

  const standalone = filtered.filter((w) => !w.requiresApp);
  const unlocked = filtered.filter((w) => w.requiresApp && !isLocked(w));
  const locked = filtered.filter((w) => w.requiresApp && isLocked(w));

  if (!open) return null;

  const renderCard = (widget: MarketplaceWidget, disabled: boolean) => (
    <button
      key={widget.id}
      onClick={() => !disabled && onPlaceWidget(widget)}
      disabled={disabled}
      className="flex flex-col items-center gap-2 group outline-none disabled:cursor-default"
    >
      <img
        src={widget.iconUrl}
        alt={widget.name}
        className={`h-16 w-16 rounded-[16px] transition-transform duration-150 drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)] ${
          disabled ? "opacity-35" : "group-hover:scale-110 group-focus-visible:scale-110"
        }`}
        draggable={false}
      />
      <span
        className={`text-xs text-center leading-tight max-w-full truncate px-1 ${disabled ? "text-white/40" : "text-white"}`}
        style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.6)" }}
      >
        {widget.name}
      </span>
      {disabled && (
        <span className="text-[10px] text-white/35 text-center leading-tight max-w-[110px]">
          Install {appNameById.get(widget.requiresApp!) ?? widget.requiresApp} to unlock
        </span>
      )}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center bg-black/40 backdrop-blur-[60px] backdrop-saturate-[1.8] animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder="Search Widgets"
        className="mt-20 w-[420px] rounded-[20px] bg-white/10 border border-white/15 px-5 py-3 text-base text-white placeholder:text-white/50 outline-none focus:bg-white/15 transition-colors shrink-0"
      />

      <div className="mt-12 max-w-[900px] w-full px-10 pb-20 space-y-10" onClick={(e) => e.stopPropagation()}>
        {standalone.length > 0 && (
          <section>
            <div className="grid gap-x-6 gap-y-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" }}>
              {standalone.map((w) => renderCard(w, false))}
            </div>
          </section>
        )}

        {unlocked.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-4">
              From your installed apps
            </h3>
            <div className="grid gap-x-6 gap-y-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" }}>
              {unlocked.map((w) => renderCard(w, false))}
            </div>
          </section>
        )}

        {locked.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-4">Locked</h3>
            <div className="grid gap-x-6 gap-y-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" }}>
              {locked.map((w) => renderCard(w, true))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-sm text-white/50 mt-8">No widgets found</p>
        )}
      </div>
    </div>
  );
}
