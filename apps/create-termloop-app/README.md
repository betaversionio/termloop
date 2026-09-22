# create-termloop-app

![Version](https://img.shields.io/npm/v/create-termloop-app?label=version)
![License](https://img.shields.io/badge/license-MIT-green)

Scaffold a new [TermLoop](https://github.com/betaversionio/termloop) marketplace app or desktop widget — a small React component that runs inside TermLoop's desktop UI, with access to the connected server's terminal, files, and stats via the `@termloop/react` SDK.

## Usage

```bash
npm create termloop-app my-app
cd my-app
npm install
npm run build
```

This generates:

```
my-app/
  package.json
  tsconfig.json
  vite.config.ts
  termloop.manifest.json   # app metadata (name, icon, default window size, category...)
  src/
    main.tsx               # registers the app with defineApp()
    App.tsx                # your component, receives the TermLoop SDK
```

### Widgets

Pass `--widget` to scaffold a **desktop widget** instead — a small, always-visible panel placed directly on the desktop (like a clock or a server-stats card), rather than an app opened in a window:

```bash
npm create termloop-app my-widget -- --widget
cd my-widget
npm install
npm run build
```

This generates the same shape, but `termloop.widget-manifest.json` (declaring `sizes: { small, medium, large }` instead of a window size, and an optional `requiresApp` if your widget belongs to one of your apps) and `src/Widget.tsx`, whose component receives `{ connectionId, size }` (no `windowId`/`payload` — there's no window) and registers via `defineWidget()`.

## Writing your app

`src/App.tsx` receives a `TermLoopSDK` instance — the host's React instance, pre-styled UI components (Button, Card, Dialog, Tabs...), and hooks for the connected server (`useConnection`, `useSFTP`, `useSSH`, `useStats`, `useFileList`):

```tsx
import type { TermLoopSDK } from "@termloop/react";

export function createApp(sdk: TermLoopSDK) {
  const { useConnection } = sdk.hooks;
  const { Card, CardContent } = sdk.ui;

  return function MyApp({ connectionId }: { connectionId: string }) {
    const connection = useConnection(connectionId);
    return (
      <Card>
        <CardContent>Connected to: {connection.data?.name}</CardContent>
      </Card>
    );
  };
}
```

## Publishing

`npm run build` produces a single bundle at `dist/<id>.js`. Upload it wherever your manifest's `bundleUrl` points, then open a PR adding the manifest entry to `catalog.json` (apps) or `widgets-catalog.json` (widgets) — see [CONTRIBUTING.md](https://github.com/betaversionio/termloop/blob/main/CONTRIBUTING.md) for the full walkthrough.

## License

MIT
