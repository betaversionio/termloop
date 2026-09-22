# Changelog

Notable changes to `termloop` (the CLI/daemon), tracked from this file's introduction onward. Each of TermLoop's packages (`termloop`, `create-termloop-app`, `@termloop/react`, the VS Code extension) is released and versioned independently — see [GitHub Releases](https://github.com/betaversionio/termloop/releases) for the full history and for other packages' changes.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.5.1] - 2026-09-23

### Added
- Custom title bars for marketplace apps — `"titleBarStyle": "custom"` in a manifest lets an app draw its own toolbar/tabs where the title bar used to be, with `sdk.ui.WindowDragRegion` to make it draggable.

### Fixed
- A window's own title bar/traffic lights no longer disappear when maximized.
- The OS menu bar no longer hides in full screen — it was overlapping and intercepting clicks on a maximized window's now-always-visible traffic lights.

## [0.5.0] - 2026-09-22

### Added
- Desktop Widgets — small, always-visible panels placed directly on the desktop (Clock, Server Stats, and a Docker Containers example), contributable by third parties the same way as marketplace apps.
- `CONTRIBUTING.md` and a `create-termloop-app --widget` scaffold for widget authors, plus a `pnpm validate-catalog` check for both catalogs.

[Unreleased]: https://github.com/betaversionio/termloop/compare/cli-v0.5.1...HEAD
[0.5.1]: https://github.com/betaversionio/termloop/releases/tag/cli-v0.5.1
[0.5.0]: https://github.com/betaversionio/termloop/releases/tag/cli-v0.5.0
