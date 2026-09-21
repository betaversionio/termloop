import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useMarketplace } from "./marketplace-context";
import { MarketplaceAppErrorBoundary } from "./marketplace-app-error-boundary";
import type { MarketplaceAppManifest } from "../types";
import type { MarketplaceAppProps } from "../lib/sdk";

interface MarketplaceAppHostProps {
  manifest: MarketplaceAppManifest;
  connectionId: string;
  payload?: Record<string, unknown>;
  windowId: string;
}

export function MarketplaceAppHost({
  manifest,
  connectionId,
  payload,
  windowId,
}: MarketplaceAppHostProps) {
  const { loadApp } = useMarketplace();
  const [AppComponent, setAppComponent] = useState<React.ComponentType<MarketplaceAppProps> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadApp(manifest)
      .then((Component) => {
        if (!cancelled) setAppComponent(() => Component);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load app");
      });

    return () => {
      cancelled = true;
    };
  }, [manifest, loadApp]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <div className="text-3xl">⚠️</div>
        <h3 className="text-sm font-semibold text-foreground">
          Failed to load {manifest.name}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
      </div>
    );
  }

  if (!AppComponent) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Spinner className="size-6" />
        <span className="text-xs text-muted-foreground">
          Loading {manifest.name}...
        </span>
      </div>
    );
  }

  return (
    <MarketplaceAppErrorBoundary appId={manifest.id}>
      <AppComponent connectionId={connectionId} payload={payload} windowId={windowId} />
    </MarketplaceAppErrorBoundary>
  );
}
