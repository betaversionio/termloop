# TermLoop Claude Code plugin

Bundles TermLoop's MCP server (server management, remote commands, SFTP, live stats) with a skill that teaches Claude how to use those tools well — resolving connections by name, when to run a command visibly vs. in the background, and safety around destructive operations.

Requires a TermLoop daemon already running (`npx termloop`) — this plugin connects to it over HTTP at `http://localhost:3721/mcp`; it doesn't start one itself. If you changed the daemon's port with `--port`, update the `url` in `.mcp.json` to match.

## Install

For local development/testing, point Claude Code at this directory directly — no marketplace needed:

```bash
claude --plugin-dir ./claude-plugin
```

or persist it across sessions:

```bash
export CLAUDE_CODE_PLUGIN_DIRS=/absolute/path/to/termloop/claude-plugin
```

Inside a running session, `/reload-plugins` picks up edits to this plugin without restarting.
