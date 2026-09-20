import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  platform: "node",
  clean: true,
  dts: false,
  // package.json already declares "type": "module", so plain .js is unambiguous —
  // keep the bin entry at dist/index.js instead of tsdown's default dist/index.mjs.
  fixedExtension: false,
  // Workspace-only packages have no published npm version to depend on —
  // inline them so the published `termloop` package needs nothing unpublished.
  deps: {
    alwaysBundle: ["@termloop/client", "@termloop/shared", "ws"],
    onlyBundle: false,
  },
});
