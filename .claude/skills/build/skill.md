---
name: build
description: Build, link, and test the TermLoop CLI application
disable-model-invocation: true
allowed-tools:
  - Bash
---

Build and test the TermLoop application by running the following steps sequentially:

1. **Build all packages:**
   ```
   pnpm build:pkg
   ```
   This runs `turbo build` across all packages (shared → server + web → cli) and bundles the CLI.

2. **Link the CLI globally:**
   ```
   pnpm link:cli
   ```
   This makes the `termloop` command available globally via `pnpm link --global`.

3. **Test the application:**
   ```
   termloop
   ```
   This launches the TermLoop server and opens the browser UI.

Run each step sequentially. If any step fails, stop and report the error — do NOT continue to the next step.

All commands must be run from the project root directory: `C:\Users\lenovo\Documents\Code\BetaVersion.IO\TermLoop`
