# Security Policy

## Reporting a vulnerability

Please **don't** open a public GitHub issue for security vulnerabilities. Instead, use GitHub's private reporting for this repo: go to the **Security** tab → **Report a vulnerability**. This opens a private advisory only visible to maintainers until it's resolved.

Include as much detail as you can — affected version, reproduction steps, and impact. We'll acknowledge reports as quickly as we can and keep you updated as we work on a fix.

## Supported versions

Only the latest published version of each package (`termloop`, `create-termloop-app`, `@termloop/react`, the VS Code extension) receives security fixes. There are no LTS/maintenance branches — please upgrade to the latest release before reporting an issue to confirm it's still present.

## Marketplace apps and widgets — trust model

This is the most important thing to understand about TermLoop's attack surface, and it's worth being explicit about rather than assuming it's obvious.

Third-party marketplace apps and desktop widgets (see [CONTRIBUTING.md](CONTRIBUTING.md)) run as plain `<script>` tags injected into the main page — **not** in a sandboxed iframe, with no Content-Security-Policy restricting them. Once loaded, they get the full `TermLoopSDK`, which includes:

- Arbitrary shell command execution on the connected server (`sdk.hooks.useSSH`)
- Arbitrary file read/write/delete on the connected server's filesystem (`sdk.hooks.useSFTP`)
- Full access to the host page's DOM, `window`, `fetch`, and `localStorage` — the SDK is a convenience API, not a security boundary
- For widgets specifically: this runs continuously in the background for as long as the widget is placed on the desktop, not just while a window is open

The only gate today is PR review before a bundle is merged into `packages/web/public/marketplace-apps/` (or `widget-bundles/`) and its manifest added to the catalog — there's no runtime sandboxing, no code signing, and no automated scanning of submitted bundles. Only install apps/widgets you trust, the same way you'd think about installing a browser extension or a VS Code extension with broad permissions.

If you find a way to abuse this beyond what's already documented here (e.g. a way for a marketplace app to escape and affect *other* TermLoop instances, exfiltrate data cross-connection, or otherwise exceed what its own connection's SSH/SFTP access already permits), please report it via the process above.
