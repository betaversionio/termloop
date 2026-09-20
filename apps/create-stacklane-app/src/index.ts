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
        "@stacklane/react": "^0.1.0",
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
import type { StackLaneSDK } from "@stacklane/react";

type AppFactory = (sdk: StackLaneSDK) => {
  default: React.ComponentType<{ connectionId: string; payload?: Record<string, unknown> }>;
};

declare global {
  interface Window {
    __stacklane_register?: (id: string, factory: AppFactory) => void;
  }
}

window.__stacklane_register?.("${name}", (sdk) => {
  return { default: createApp(sdk) };
});
`;
}

function appTsx(name: string): string {
  const componentName = toPascal(name);
  return `import type { StackLaneSDK } from "@stacklane/react";

interface AppProps {
  connectionId: string;
  payload?: Record<string, unknown>;
}

export function createApp(sdk: StackLaneSDK) {
  const { useConnection } = sdk.hooks;
  const { Button, Card, CardHeader, CardTitle, CardContent } = sdk.ui;

  return function ${componentName}({ connectionId }: AppProps) {
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
      description: `A StackLane marketplace app`,
      author: "",
      version: "0.1.0",
      iconUrl: "",
      bundleUrl: `https://registry.stacklane.dev/apps/${name}/${name}.js`,
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
//  Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const rawName = args[0];

  if (!rawName || rawName === "--help" || rawName === "-h") {
    console.log(`
Usage: create-stacklane-app <app-name>

Scaffolds a new StackLane marketplace app project.

Example:
  npx create-stacklane-app my-app
  cd my-app
  npm install
  npm run build
`);
    process.exit(rawName ? 0 : 1);
  }

  const name = toKebab(basename(rawName));
  const dir = resolve(process.cwd(), rawName);

  console.log(`\nCreating StackLane app in ${dir}\n`);

  // Create directories
  mkdirSync(join(dir, "src"), { recursive: true });

  // Write files
  const files: [string, string][] = [
    ["package.json", packageJson(name)],
    ["tsconfig.json", tsconfig()],
    ["vite.config.ts", viteConfig(name)],
    ["src/main.tsx", mainTsx(name)],
    ["src/App.tsx", appTsx(name)],
    ["stacklane.manifest.json", manifest(name)],
  ];

  for (const [path, content] of files) {
    const fullPath = join(dir, path);
    writeFileSync(fullPath, content, "utf-8");
    console.log(`  created ${path}`);
  }

  console.log(`
Done! Next steps:

  cd ${rawName}
  npm install
  npm run build

The built bundle will be at dist/${name}.js
Upload it to your registry and add the manifest to catalog.json.
`);
}

main();
