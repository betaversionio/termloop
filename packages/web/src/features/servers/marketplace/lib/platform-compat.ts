import type { MarketplaceApp } from "@termloop/shared";

/**
 * Whether a marketplace app can run against a server reporting the given
 * `uname -s` platform (e.g. "Linux", "Darwin", "OS400" for IBM i PASE).
 * Apps are compatible everywhere by default; `incompatiblePlatforms` opts an
 * app out of specific platforms (e.g. a Docker app has no Docker daemon on IBM i).
 * Unknown/missing platform info never hides an app.
 */
export function isPlatformCompatible(
  app: Pick<MarketplaceApp, "incompatiblePlatforms">,
  platform: string | undefined
): boolean {
  if (!platform || !app.incompatiblePlatforms?.length) return true;
  return !app.incompatiblePlatforms.some(
    (p) => p.toLowerCase() === platform.toLowerCase()
  );
}
