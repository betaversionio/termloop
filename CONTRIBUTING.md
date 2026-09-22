# Contributing to TermLoop

## Marketplace apps and desktop widgets

TermLoop's desktop has two extension points third parties can build and contribute:

- **Apps** — a window you open from the Dock, Launchpad, or a file association (e.g. Docker, Image Viewer).
- **Widgets** — a small, always-visible panel placed directly on the desktop (e.g. Clock, Server Stats). A widget can optionally declare `requiresApp` to unlock alongside one of your apps.

Both are plain React components loaded into TermLoop at runtime via a `TermLoopSDK` the host injects — you don't bundle React yourself, and you get the connected server's terminal/files/stats through `sdk.hooks`.

### 1. Scaffold

```bash
npm create termloop-app my-app          # an app
npm create termloop-app my-widget -- --widget   # a widget
```

See [`@termloop/react`'s README](packages/react/README.md) for the full SDK reference (hooks, UI components, `defineApp`/`defineWidget`).

### 2. Build

```bash
cd my-app   # or my-widget
npm install
npm run build
```

Produces a single self-contained bundle at `dist/<id>.js`.

### 3. Host the bundle and icon

Add your built bundle and an icon under this repo:

| | App | Widget |
| --- | --- | --- |
| Bundle | `packages/web/public/marketplace-apps/<id>.js` | `packages/web/public/widget-bundles/<id>.js` |
| Icon | `packages/web/public/marketplace-icons/<id>.{svg,png,webp}` | `packages/web/public/widget-icons/<id>.{svg,png,webp}` |

(There's no separate hosted registry today — bundles and icons are static files served by the same web app, checked into this repo.)

### 4. Add your manifest to the catalog

Append your `termloop.manifest.json` (apps) or `termloop.widget-manifest.json` (widgets) as an entry in:

- Apps: `packages/web/public/registry/catalog.json` — shape is `MarketplaceApp` (`packages/shared/src/types/marketplace.ts`).
- Widgets: `packages/web/public/registry/widgets-catalog.json` — shape is `MarketplaceWidget` (`packages/shared/src/types/widget.ts`).

Update `bundleUrl`/`iconUrl` to the `/marketplace-apps/...`, `/marketplace-icons/...`, `/widget-bundles/...`, or `/widget-icons/...` path from step 3.

Run `pnpm validate-catalog` before opening your PR — it checks both catalogs against their TypeScript shapes so a malformed entry fails in CI rather than silently breaking the gallery at runtime.

### 5. Open a PR

That's it — a PR touching only your new bundle, icon, and one catalog entry. No server-side submission process exists (or is planned); review happens the same way as any other PR to this repo.

### A note on trust

Marketplace app and widget code runs directly in the main page (a `<script>` tag, not a sandboxed iframe) with full SDK access — including arbitrary SSH command execution and SFTP read/write/delete on the connected server. Widgets additionally run continuously for as long as they're placed on the desktop, not just while a window is open. Review submissions with that in mind; don't add dependencies or network calls beyond what your app/widget's stated purpose needs.

## Everything else

For CLI, server, or web app changes, see the root [README.md](README.md) for local dev setup. Run `pnpm build` before opening a PR.
