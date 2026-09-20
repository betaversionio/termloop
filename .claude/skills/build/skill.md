---
name: build
description: Build and test the TermLoop CLI application
disable-model-invocation: true
allowed-tools:
  - Bash
---

Build and test the TermLoop application by running the following steps sequentially, from the repo root.

1. **Build all packages:**
   ```
   pnpm build:pkg
   ```
   This runs `turbo build` across all packages (shared → server + web + client → cli) and bundles the CLI's `apps/cli/dist/`.

2. **Test the application:**
   ```
   node apps/cli/dist/index.js
   ```
   This launches the TermLoop daemon and opens the browser UI. Run it directly from the built output rather than via a global link — `pnpm link --global` (what an older version of this skill used) no longer exists in this repo's pnpm version, and its replacement (`pnpm add --global ./apps/cli`) needs a one-time `pnpm setup` on the machine first to put pnpm's global bin directory on `PATH`. Running the built file directly needs neither.

Run each step sequentially. If any step fails, stop and report the error — do NOT continue to the next step.
