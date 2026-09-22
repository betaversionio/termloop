#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, basename } from "node:path";

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

function toKebab(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function toPascal(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

// ---------------------------------------------------------------------------
//  Template files
// ---------------------------------------------------------------------------

function packageJson(name: string): string {
  return JSON.stringify(
    {
      name,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: "vite build --watch",
        build: "vite build",
      },
      dependencies: {
        "@termloop/react": "^0.1.0",
      },
      devDependencies: {
        "@types/react": "^19.0.0",
        "@vitejs/plugin-react": "^4.3.0",
        react: "^19.0.0",
        typescript: "^5.7.0",
        vite: "^6.0.0",
      },
    },
    null,
    2
  );
}

function tsconfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        jsx: "react",
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ["src"],
    },
    null,
    2
  );
}

function viteConfig(name: string): string {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ jsxRuntime: "classic" })],
  build: {
    lib: {
      entry: "src/main.tsx",
      name: "${toPascal(name)}App",
      formats: ["iife"],
      fileName: () => "${name}.js",
    },
    rollupOptions: {
      external: ["react"],
      output: {
        globals: { react: "React" },
      },
    },
  },
});
`;
}

function mainTsx(name: string): string {
  return `import { createApp } from "./App";
import type { AppFactory } from "@termloop/react";

declare global {
  interface Window {
    __termloop_register?: (id: string, factory: AppFactory) => void;
  }
}

window.__termloop_register?.("${name}", (sdk) => {
  return { default: createApp(sdk) };
});
`;
}

function appTsx(name: string): string {
  const componentName = toPascal(name);
  return `// Needed for JSX to type-check under the classic transform (see vite.config.ts) —
// at runtime this import is externalized to the host's own React instance instead of
// bundling a second copy, so you never call anything on it directly.
import React from "react";
import type { TermLoopSDK, MarketplaceAppProps } from "@termloop/react";

export function createApp(sdk: TermLoopSDK) {
  const { useConnection } = sdk.hooks;
  const { Button, Card, CardHeader, CardTitle, CardContent } = sdk.ui;

  return function ${componentName}({ connectionId }: MarketplaceAppProps) {
    const connection = useConnection(connectionId);

    if (connection.isLoading) {
      return <div>Loading...</div>;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>${componentName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Connected to: {connection.data?.name ?? connectionId}</p>
          <Button onClick={() => alert("Hello from ${componentName}!")}>
            Click me
          </Button>
        </CardContent>
      </Card>
    );
  };
}
`;
}

function manifest(name: string): string {
  return JSON.stringify(
    {
      id: name,
      name: toPascal(name),
      description: `A TermLoop marketplace app`,
      author: "",
      version: "0.1.0",
      iconUrl: "",
      bundleUrl: `https://registry.termloop.dev/apps/${name}/${name}.js`,
      fileAssociations: [],
      defaultSize: { width: 800, height: 600 },
      minWidth: 400,
      minHeight: 300,
      showOnDesktop: false,
      showInDock: false,
      category: "utilities",
    },
    null,
    2
  );
}

// ---------------------------------------------------------------------------
//  Widget template files
// ---------------------------------------------------------------------------

function widgetMainTsx(name: string): string {
  return `import { createWidget } from "./Widget";
import type { WidgetFactory } from "@termloop/react";

declare global {
  interface Window {
    __termloop_register?: (id: string, factory: WidgetFactory) => void;
  }
}

window.__termloop_register?.("${name}", (sdk) => {
  return { default: createWidget(sdk) };
});
`;
}

function widgetTsx(name: string): string {
  const componentName = toPascal(name);
  return `// Needed for JSX to type-check under the classic transform (see vite.config.ts) —
// at runtime this import is externalized to the host's own React instance instead of
// bundling a second copy, so you never call anything on it directly.
import React from "react";
import type { TermLoopSDK, WidgetProps } from "@termloop/react";

export function createWidget(sdk: TermLoopSDK) {
  const { useConnection } = sdk.hooks;

  return function ${componentName}({ connectionId, size }: WidgetProps) {
    const connection = useConnection(connectionId);
    const fontSize = size === "small" ? 14 : size === "medium" ? 18 : 24;

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize,
          textAlign: "center",
          padding: 12,
        }}
      >
        {connection.data?.name ?? connectionId}
      </div>
    );
  };
}
`;
}

function widgetManifest(name: string): string {
  return JSON.stringify(
    {
      id: name,
      name: toPascal(name),
      description: `A TermLoop desktop widget`,
      author: "",
      version: "0.1.0",
      iconUrl: "",
      bundleUrl: `https://registry.termloop.dev/widgets/${name}/${name}.js`,
      sizes: {
        small: { width: 180, height: 180 },
        medium: { width: 360, height: 180 },
      },
      category: "utilities",
    },
    null,
    2
  );
}

// ---------------------------------------------------------------------------
//  Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const isWidget = args.includes("--widget");
  const rawName = args.find((a) => !a.startsWith("-"));

  if (!rawName || args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: create-termloop-app <name> [--widget]

Scaffolds a new TermLoop marketplace app project. Pass --widget to scaffold a
desktop widget instead (a small, always-visible panel, not a windowed app).

Examples:
  npx create-termloop-app my-app
  npx create-termloop-app my-widget --widget
  cd my-app
  npm install
  npm run build
`);
    process.exit(rawName ? 0 : 1);
  }

  const name = toKebab(basename(rawName));
  const dir = resolve(process.cwd(), rawName);

  console.log(`\nCreating TermLoop ${isWidget ? "widget" : "app"} in ${dir}\n`);

  // Create directories
  mkdirSync(join(dir, "src"), { recursive: true });

  // Write files
  const files: [string, string][] = isWidget
    ? [
        ["package.json", packageJson(name)],
        ["tsconfig.json", tsconfig()],
        ["vite.config.ts", viteConfig(name)],
        ["src/main.tsx", widgetMainTsx(name)],
        ["src/Widget.tsx", widgetTsx(name)],
        ["termloop.widget-manifest.json", widgetManifest(name)],
      ]
    : [
        ["package.json", packageJson(name)],
        ["tsconfig.json", tsconfig()],
        ["vite.config.ts", viteConfig(name)],
        ["src/main.tsx", mainTsx(name)],
        ["src/App.tsx", appTsx(name)],
        ["termloop.manifest.json", manifest(name)],
      ];

  for (const [path, content] of files) {
    const fullPath = join(dir, path);
    writeFileSync(fullPath, content, "utf-8");
    console.log(`  created ${path}`);
  }

  const manifestFile = isWidget ? "termloop.widget-manifest.json" : "termloop.manifest.json";
  const catalogFile = isWidget ? "widgets-catalog.json" : "catalog.json";

  console.log(`
Done! Next steps:

  cd ${rawName}
  npm install
  npm run build

The built bundle will be at dist/${name}.js
Upload it to your registry, then submit a PR adding your ${manifestFile}
entry to ${catalogFile} — see CONTRIBUTING.md.
`);
}

main();
