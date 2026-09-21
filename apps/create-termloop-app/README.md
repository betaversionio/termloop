# create-termloop-app

![Version](https://img.shields.io/npm/v/create-termloop-app?label=version)
![License](https://img.shields.io/badge/license-MIT-green)

Scaffold a new [TermLoop](https://github.com/betaversionio/termloop) marketplace app — a small React component that runs inside TermLoop's desktop UI, with access to the connected server's terminal, files, and stats via the `@termloop/react` SDK.

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

`npm run build` produces a single bundle at `dist/<app-id>.js`. Upload it wherever `termloop.manifest.json`'s `bundleUrl` points, then add the manifest to TermLoop's app catalog for it to show up in the marketplace.

## License

MIT
