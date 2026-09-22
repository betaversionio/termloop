import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useWidgets } from "@/features/servers/marketplace/components/widgets-context";
import { MarketplaceAppErrorBoundary } from "@/features/servers/marketplace/components/marketplace-app-error-boundary";
import type { MarketplaceWidget } from "@termloop/shared";
import type { WidgetProps } from "@/features/servers/marketplace/lib/sdk";
import type { WidgetSize } from "../../context/desktop-settings-context";

interface WidgetHostProps {
  manifest: MarketplaceWidget;
  connectionId: string;
  size: WidgetSize;
}

export function WidgetHost({ manifest, connectionId, size }: WidgetHostProps) {
  const { loadWidget } = useWidgets();
  const [WidgetComponent, setWidgetComponent] = useState<React.ComponentType<WidgetProps> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadWidget(manifest)
      .then((Component) => {
        if (!cancelled) setWidgetComponent(() => Component);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load widget");
      });

    return () => {
      cancelled = true;
    };
  }, [manifest, loadWidget]);

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-3 text-center">
        <div className="text-lg">⚠️</div>
        <p className="text-[11px] text-white/70">{error}</p>
      </div>
    );
  }

  if (!WidgetComponent) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner className="size-4 text-white/70" />
      </div>
    );
  }

  return (
    <MarketplaceAppErrorBoundary appId={manifest.id}>
      <WidgetComponent connectionId={connectionId} size={size} />
    </MarketplaceAppErrorBoundary>
  );
}
