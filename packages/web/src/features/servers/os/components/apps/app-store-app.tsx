import { useMemo, useState } from "react";
import { useMarketplace } from "@/features/servers/marketplace/components/marketplace-context";
import type { MarketplaceAppManifest } from "@/features/servers/marketplace/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  Trash2,
  Download,
  Package,
  AlertCircle,
  ArrowLeft,
  Star,
  LayoutGrid,
  CheckCircle2,
  Wrench,
  Image as ImageIcon,
  Code2,
  SlidersHorizontal,
  MoreHorizontal,
} from "lucide-react";

type Category = "tools" | "media" | "development" | "utilities" | "other";
type SidebarKey = "all" | "installed" | Category;

const CATEGORY_META: Record<Category, { label: string; icon: typeof Wrench; color: string }> = {
  development: { label: "Development", icon: Code2, color: "#30D158" },
  media: { label: "Media", icon: ImageIcon, color: "#FF375F" },
  tools: { label: "Tools", icon: Wrench, color: "#FF9500" },
  utilities: { label: "Utilities", icon: SlidersHorizontal, color: "#5E5CE6" },
  other: { label: "Other", icon: MoreHorizontal, color: "#8E8E93" },
};

const SIDEBAR_ITEMS: { key: SidebarKey; label: string; icon: typeof LayoutGrid; color: string }[] = [
  { key: "all", label: "All Apps", icon: LayoutGrid, color: "#0A84FF" },
  { key: "installed", label: "Installed", icon: CheckCircle2, color: "#32D74B" },
  ...(Object.keys(CATEGORY_META) as Category[]).map((key) => ({
    key,
    label: CATEGORY_META[key].label,
    icon: CATEGORY_META[key].icon,
    color: CATEGORY_META[key].color,
  })),
];

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

function StarRating({ rating, size = "h-3.5 w-3.5" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            size,
            i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export function AppStoreApp() {
  const { catalog, catalogLoading, catalogError, installedApps, installApp, uninstallApp, isInstalled } =
    useMarketplace();
  const [section, setSection] = useState<SidebarKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const appsById = useMemo(() => {
    const map = new Map<string, MarketplaceAppManifest>();
    for (const manifest of catalog) map.set(manifest.id, manifest);
    for (const { manifest } of installedApps) map.set(manifest.id, manifest);
    return map;
  }, [catalog, installedApps]);

  const selected = selectedId ? appsById.get(selectedId) ?? null : null;

  const visibleApps = useMemo(() => {
    if (section === "all") return catalog;
    if (section === "installed") return installedApps.map((a) => a.manifest);
    return catalog.filter((m) => m.category === section);
  }, [section, catalog, installedApps]);

  const sectionLabel = SIDEBAR_ITEMS.find((s) => s.key === section)?.label ?? "All Apps";

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* Sidebar */}
      <nav className="w-[190px] shrink-0 border-r border-border bg-muted/30 py-3 px-2 space-y-0.5 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setSection(item.key);
              setSelectedId(null);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors text-left",
              section === item.key && !selected
                ? "bg-[#0A84FF] text-white"
                : "text-foreground hover:bg-muted",
            )}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px]"
              style={{ backgroundColor: item.color }}
            >
              <item.icon className="h-3.5 w-3.5 text-white" />
            </span>
            {item.label}
            {item.key === "installed" && installedApps.length > 0 && (
              <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">
                {installedApps.length}
              </Badge>
            )}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <AppDetail
            manifest={selected}
            installed={isInstalled(selected.id)}
            onBack={() => setSelectedId(null)}
            onInstall={() => installApp(selected)}
            onUninstall={() => uninstallApp(selected.id)}
          />
        ) : (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">{sectionLabel}</h2>
            {catalogLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <Spinner className="h-6 w-6" />
                <p className="text-sm text-muted-foreground">Loading catalog...</p>
              </div>
            ) : catalogError ? (
              <div className="flex flex-col items-center justify-center gap-3 text-center py-20">
                <AlertCircle className="h-10 w-10 text-destructive/60" />
                <p className="text-sm text-destructive">Failed to load catalog</p>
                <p className="text-xs text-muted-foreground max-w-xs">{catalogError.message}</p>
              </div>
            ) : visibleApps.length === 0 ? (
              <EmptyState
                message={
                  section === "installed"
                    ? "No apps installed. Browse All Apps to find something."
                    : "No apps in this category yet."
                }
              />
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {visibleApps.map((manifest) => (
                  <AppCard
                    key={manifest.id}
                    manifest={manifest}
                    installed={isInstalled(manifest.id)}
                    onOpen={() => setSelectedId(manifest.id)}
                    onInstall={() => installApp(manifest)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AppCard({
  manifest,
  installed,
  onOpen,
  onInstall,
}: {
  manifest: MarketplaceAppManifest;
  installed: boolean;
  onOpen: () => void;
  onInstall: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="flex gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors text-left"
    >
      <img
        src={manifest.iconUrl}
        alt={manifest.name}
        className="h-12 w-12 rounded-lg shrink-0"
        draggable={false}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-foreground truncate">{manifest.name}</h3>
            <p className="text-[11px] text-muted-foreground">{manifest.author}</p>
          </div>
          <Button
            size="sm"
            variant={installed ? "secondary" : "default"}
            className="shrink-0 h-7 text-xs px-3"
            disabled={installed}
            onClick={(e) => {
              e.stopPropagation();
              onInstall();
            }}
          >
            {installed ? (
              "Installed"
            ) : (
              <>
                <Download className="h-3 w-3 mr-1" />
                Install
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{manifest.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {manifest.rating != null && (
            <div className="flex items-center gap-1">
              <StarRating rating={manifest.rating} size="h-3 w-3" />
              <span className="text-[10px] text-muted-foreground">{manifest.rating.toFixed(1)}</span>
            </div>
          )}
          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
            {manifest.category}
          </Badge>
        </div>
      </div>
    </button>
  );
}

function AppDetail({
  manifest,
  installed,
  onBack,
  onInstall,
  onUninstall,
}: {
  manifest: MarketplaceAppManifest;
  installed: boolean;
  onBack: () => void;
  onInstall: () => void;
  onUninstall: () => void;
}) {
  const categoryMeta = CATEGORY_META[manifest.category];

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <img
          src={manifest.iconUrl}
          alt={manifest.name}
          className="h-20 w-20 rounded-2xl shrink-0"
          draggable={false}
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-foreground">{manifest.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {manifest.author} · v{manifest.version}
          </p>
          <div className="flex items-center gap-3 mt-2">
            {manifest.rating != null && (
              <div className="flex items-center gap-1.5">
                <StarRating rating={manifest.rating} />
                <span className="text-sm font-medium">{manifest.rating.toFixed(1)}</span>
                {manifest.ratingCount != null && (
                  <span className="text-xs text-muted-foreground">
                    ({formatCount(manifest.ratingCount)} ratings)
                  </span>
                )}
              </div>
            )}
            {manifest.installCount != null && (
              <span className="text-xs text-muted-foreground">
                {formatCount(manifest.installCount)} installs
              </span>
            )}
          </div>
        </div>
        <Button
          variant={installed ? "secondary" : "default"}
          className="shrink-0"
          onClick={installed ? onUninstall : onInstall}
        >
          {installed ? (
            <>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Uninstall
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1.5" />
              Install
            </>
          )}
        </Button>
      </div>

      {/* Category + tags */}
      <div className="flex flex-wrap items-center gap-1.5 mt-4">
        <Badge variant="outline" className="gap-1">
          <categoryMeta.icon className="h-3 w-3" style={{ color: categoryMeta.color }} />
          {categoryMeta.label}
        </Badge>
        {manifest.tags?.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[11px]">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Screenshots */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold mb-2">Preview</h2>
        {manifest.screenshots && manifest.screenshots.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {manifest.screenshots.map((src) => (
              <img
                key={src}
                src={src}
                alt={`${manifest.name} preview`}
                className="h-44 rounded-lg border border-border shrink-0"
                draggable={false}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-36 rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            No previews available yet
          </div>
        )}
      </section>

      {/* Description */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold mb-2">About</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{manifest.description}</p>
      </section>

      {/* Reviews */}
      <section className="mt-6 pb-6">
        <h2 className="text-sm font-semibold mb-3">Reviews</h2>
        {manifest.reviews && manifest.reviews.length > 0 ? (
          <div className="space-y-4">
            {manifest.reviews.map((review, i) => (
              <div key={i} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {review.author.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{review.author}</span>
                    <StarRating rating={review.rating} size="h-3 w-3" />
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No reviews yet.</p>
        )}
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-center py-20">
      <Package className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
