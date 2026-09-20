---
name: publish
description: Bump version across all files and publish TermLoop to npm
argument-hint: "<new version e.g. 0.2.0>"
allowed-tools:
  - Bash
  - Read
  - Edit
  - Grep
  - Glob
  - Skill
  - AskUserQuestion
---

Publish a new version of TermLoop to npm.

## Steps

### 1. Get the new version

If the user provided a version via `$ARGUMENTS`, use that. Otherwise, **ask the user** what version to publish using AskUserQuestion.

### 2. Detect the current version

Read `C:\Users\lenovo\Documents\Code\BetaVersion.IO\TermLoop\packages\cli\package.json` and extract the current `"version"` value.

### 3. Bump version in all files

Replace the **current version** with the **new version** in these files:

1. **`C:\Users\lenovo\Documents\Code\BetaVersion.IO\TermLoop\packages\cli\package.json`**
   - Update the `"version"` field

2. **`C:\Users\lenovo\Documents\Code\BetaVersion.IO\TermLoop\README.md`**
   - Update the version badge: `version-X.Y.Z-blue`

3. **`C:\Users\lenovo\Documents\Code\BetaVersion.IO\TermLoop\packages\cli\README.md`**
   - Update the version badge: `version-X.Y.Z-blue`

4. **`C:\Users\lenovo\Documents\Code\BetaVersion.IO\TermLoop\packages\web\src\pages\settings\settings-page.tsx`**
   - Update the hardcoded version string displayed in the UI

Use the Edit tool with `replace_all: true` to ensure all occurrences of the old version are replaced in each file.

### 4. Commit all changes

Run `git status` to check if there are uncommitted changes. If there are, invoke the `/commit` skill with the hint `🔖 bump version to X.Y.Z` (where X.Y.Z is the new version) to commit everything using the project's gitmoji convention.

### 5. Tag the release

After the commit is created, add a git tag for the new version:

```
git tag vX.Y.Z
```

(where X.Y.Z is the new version)

### 6. Build and publish

Run the following commands sequentially from the project root (`C:\Users\lenovo\Documents\Code\BetaVersion.IO\TermLoop`):

```
pnpm build:pkg
```

If the build succeeds, publish:

```
pnpm publish:npm
```

If any step fails, stop and report the error.

### 7. Push commit and tag

Push the commit and tag to remote:

```
git push && git push --tags
```

### 8. Report

After publishing, report the new version number and confirm success.
