# @termloop/react

![Version](https://img.shields.io/npm/v/@termloop/react?label=version)
![License](https://img.shields.io/badge/license-MIT-green)

SDK for building [TermLoop](https://github.com/betaversionio/termloop) marketplace apps — small React components that run inside TermLoop's desktop UI, with access to the connected server's terminal, files, and stats.

Scaffold a new app with [`create-termloop-app`](https://www.npmjs.com/package/create-termloop-app) rather than installing this directly:

```bash
npm create termloop-app my-app
```

## How it works

TermLoop injects a `TermLoopSDK` instance into your app at runtime — you never import React or UI components yourself, you receive them from the host. This keeps every marketplace app on the same React instance and design system as TermLoop itself.

```tsx
import { defineApp, type TermLoopSDK, type MarketplaceAppProps } from "@termloop/react";

defineApp("my-image-viewer", (sdk: TermLoopSDK) => {
  const { React, ui, hooks } = sdk;
  const { useState, useEffect } = React;
  const { Button, Spinner } = ui;

  function ImageViewer({ connectionId, payload }: MarketplaceAppProps) {
    const sftp = hooks.useSFTP(connectionId);
    const filePath = (payload?.filePath as string) || "";
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
      if (filePath) setSrc(sftp.downloadUrl(filePath));
    }, [filePath]);

    if (!src) return <Spinner />;
    return <img src={src} alt="preview" style={{ maxWidth: "100%" }} />;
  }

  return { default: ImageViewer };
});
```

## Hooks

All hooks take the active `connectionId` and talk to the connected server over TermLoop's existing SSH/SFTP session — no separate auth or connection setup needed.

| Hook | Purpose |
| --- | --- |
| `useConnection(connectionId)` | Connection details — host, username, port, name |
| `useSFTP(connectionId)` | File operations: `list`, `read`, `write`, `upload`, `remove`, `rename`, `mkdir`, `downloadUrl`, `invalidate` |
| `useSSH(connectionId)` | `execute(command)` — run a shell command, get back `stdout`/`stderr`/`code` |
| `useStats(connectionId)` | CPU/memory/disk/uptime, auto-refreshing every 5s |
| `useFileList(connectionId, path)` | Directory listing with caching |
| `useQuery` / `useMutation` | Raw [React Query](https://tanstack.com/query) primitives for custom data fetching |
| `useWindow(windowId)` | Control this app's own window — `title`/`setTitle`, `close`, `focus`, `minimize`/`maximize`/`restore`, `resize`, `isFocused`/`isMaximized`/`isMinimized` |
| `useOS()` | Desktop-level context — `theme`/`setTheme`, `wallpaper`/`setWallpaper`, the host app's `version` |

`windowId` comes from your component's `MarketplaceAppProps` — it identifies *this instance's* window, so a `useWindow()` call always controls the right one even with multiple copies of your app open at once:

```tsx
function Editor({ connectionId, windowId, payload }: MarketplaceAppProps) {
  const win = hooks.useWindow(windowId);
  const filePath = payload?.filePath as string | undefined;

  useEffect(() => {
    if (filePath) win.setTitle(`Editor — ${filePath.split("/").pop()}`);
  }, [filePath]);

  // ...
}
```

## UI components

Pre-styled [shadcn/ui](https://ui.shadcn.com/) components matching TermLoop's own look: `Button`, `Input`, `Select` (+ `SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem`), `Card` (+ `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`), `Tabs` (+ `TabsList`/`TabsTrigger`/`TabsContent`), `Dialog` (+ `DialogTrigger`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogDescription`/`DialogFooter`/`DialogClose`), `Badge`, `Spinner`, `Separator` — all under `sdk.ui`.

`sdk.ui.toast({ title, description, variant })` shows a transient notification styled to match the host (same component TermLoop itself uses) — e.g. `sdk.ui.toast({ title: "Saved", description: file.name })`.

## Utilities

- `sdk.utils.cn(...)` — Tailwind class merger (clsx + tailwind-merge)
- `sdk.utils.request(path, options)` — HTTP helper for calling TermLoop's API directly (paths relative to the API base, e.g. `/sftp/...`, `/stats/...`)

## Publishing your app

`npm run build` (via `create-termloop-app`'s scaffold) produces a single bundle at `dist/<app-id>.js`. Host it wherever your `termloop.manifest.json`'s `bundleUrl` points, then submit the manifest to TermLoop's app catalog.

## License

MIT
