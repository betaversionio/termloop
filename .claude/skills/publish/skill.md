---
name: publish
description: Bump a package's version and push a release tag for termloop, create-termloop-app, @termloop/react, or the VS Code extension — CI does the actual publish
argument-hint: "<package> <new version> e.g. cli 0.3.0"
allowed-tools:
  - Bash
  - Read
  - Edit
  - Grep
  - Glob
  - Skill
  - AskUserQuestion
---

Bump a package's version, commit, and push a git tag that triggers its GitHub Actions release workflow. This skill does **not** run `pnpm publish`/`vsce publish` itself — `.github/workflows/release-npm.yml` and `release-vscode.yml` do the actual build + publish once the tag lands on GitHub, using the repo's `NPM_TOKEN`/`VSCE_PAT` secrets.

## Steps

### 1. Determine which package to release

Four release targets exist, each with its own git tag prefix that the matching CI workflow listens for:

| Package | Directory | Tag prefix | `package.json` |
| --- | --- | --- | --- |
| `termloop` (CLI) | `apps/cli` | `cli-v` | `apps/cli/package.json` |
| `create-termloop-app` | `apps/create-termloop-app` | `create-app-v` | `apps/create-termloop-app/package.json` |
| `@termloop/react` | `packages/react` | `react-v` | `packages/react/package.json` |
| VS Code extension | `apps/vscode-extension` | `vscode-v` | `apps/vscode-extension/package.json` |

All paths are relative to the repo root. If the user provided both a package and a version via `$ARGUMENTS`, use those. Otherwise **ask** (AskUserQuestion) which package, then what version.

### 2. Detect the current version

Read the `"version"` field from that package's `package.json` (path from the table above).

### 3. Bump the version

Update the `"version"` field in that package's `package.json` to the new version.

If releasing the **CLI** (`apps/cli`), also update the version badge (`version-X.Y.Z-blue`) in these files, which mirror the CLI's version for display — the other three packages have no equivalent hardcoded display:
- `README.md` (repo root)
- `apps/cli/README.md`
- the hardcoded version string in `packages/web/src/pages/settings/settings-page.tsx`

Use the Edit tool with `replace_all: true` for each file.

### 4. Commit

Run `git status`. If there are uncommitted changes, invoke `/commit` with the hint `🔖 bump <package> to X.Y.Z`.

### 5. Tag the release

```
git tag <prefix>X.Y.Z
```

Using the tag prefix from the table in step 1 — e.g. `cli-v0.3.0`, `vscode-v0.2.0`. This exact prefix is what the workflows match on (see `on.push.tags` in `.github/workflows/release-npm.yml`/`release-vscode.yml`); a bare `vX.Y.Z` tag won't trigger anything.

### 6. Push commit and tag

```
git push && git push --tags
```

Pushing the tag triggers the matching GitHub Actions workflow, which builds, verifies the tag's version matches `package.json` (fails loudly on mismatch), and publishes — to npm for the three npm packages, to the VS Code Marketplace for the extension — then creates a GitHub Release. This skill's job ends here; do not also run `pnpm publish`/`vsce publish` locally, since CI already does it and a duplicate attempt would just fail on a version collision.

### 7. Report

Report the new version and the tag pushed, and point the user at `github.com/betaversionio/termloop/actions` to watch the release workflow run.
