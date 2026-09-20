# SSH Agent - Termloop

Manage your remote SSH servers without leaving VS Code — connections list, an integrated terminal, and remote file browsing that opens as normal editor tabs.

This extension is a thin client for the [TermLoop](https://github.com/betaversionio/termloop) daemon (the same one behind `npx termloop` and the `termloop mcp` server) — it doesn't manage its own SSH connections, so anything you do here shows up in the TermLoop web UI too, and vice versa.

## Features

- **Connections view** — your saved servers, listed in the Explorer sidebar.
- **Integrated terminal** — click a connection to open a real SSH shell in a VS Code terminal tab.
- **Remote file browsing** — `TermLoop: Browse Files` opens a server's filesystem as a workspace folder: browse, open, edit, and save files like any local project.
- **Add Connection** — save a new server (host, port, username, password or key) without switching to the browser.
- **Copy Claude MCP Connect Command** — copies a ready-to-run `claude mcp add --transport http termloop http://localhost:<port>/mcp` so Claude Code can drive your SSH connections too. No auth token needed.

## Requirements

A TermLoop daemon needs to be running. If one isn't already up when the extension activates, it'll offer to start one for you (`npx termloop --no-open` in the background) — no manual setup required.

## Commands

| Command | Description |
| --- | --- |
| `TermLoop: Add Connection` | Save a new SSH connection |
| `TermLoop: Open Terminal` | Open an integrated terminal for a connection |
| `TermLoop: Browse Files` | Open a connection's filesystem as a workspace folder |
| `TermLoop: Refresh Connections` | Reload the connections list |
| `TermLoop: Copy Claude MCP Connect Command` | Copy the `claude mcp add` command for this daemon |

## Known limitations

- File reads/writes go over the daemon's SFTP API as UTF-8 text — binary files aren't safe to edit through this yet (same limitation as the web UI).
- No live file-change notifications — the file explorer won't auto-refresh if something else changes a remote file.

## License

MIT
