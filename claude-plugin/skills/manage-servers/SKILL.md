---
name: manage-servers
description: Use when the user wants to work with SSH servers through TermLoop — adding/listing saved connections, running remote shell commands, reading or writing remote files over SFTP, opening a terminal session, or checking a server's live CPU/memory/disk stats. Covers connectionId resolution, when to run visibly vs. in the background, and safety around destructive commands.
---

TermLoop exposes 7 tools over MCP: `list_connections`, `run_command`, `open_terminal`, `list_sessions`, `read_file`, `write_file`, `get_stats`. They all operate against a `connectionId` — a saved SSH connection the user configured in TermLoop's web UI, not a raw host string.

## Resolving a connection

Always call `list_connections` first when the user names a server by name/host rather than an id — never guess or fabricate a `connectionId`. Match on `name` or `host` from the result. If nothing matches, say so; don't fall back to a different connection silently.

## Running commands: visible vs. background

- `run_command` runs to completion and returns output. Default behavior opens an invisible background session and closes it afterward — fine for quick, safe checks (`df -h`, `systemctl status foo`, reading logs).
- Pass `visible: true` for anything long-running, interactive, or consequential (deploys, restarts, migrations) — it attaches to an already-open terminal session for that connection so the user watches it happen live, instead of it running invisibly. If no session is open it transparently falls back to background and tells you so.
- If the user is already watching a specific terminal (from `list_sessions` or a prior `open_terminal` call), pass its `sessionId` to target that exact session rather than whichever one is found first.
- `open_terminal` is idempotent — it reuses an existing session for that connection instead of opening a duplicate one, so it's safe to call without checking `list_sessions` first.

## Before anything destructive

For anything that changes state materially (`rm`, package upgrades, service restarts, DB migrations, config overwrites): confirm the specific command with the user before running it, prefer `visible: true` so they can watch it happen, and consider a `get_stats` call before/after to sanity-check the server didn't end up in a bad state (load spike, disk full, service down).

## Reading and writing remote files

`read_file` before `write_file` when editing an existing file — `write_file` fully overwrites the target path, there's no partial/patch mode. Use absolute paths; there's no implied working directory.

`read_file` returns at most 2000 lines by default; pass `offset`/`limit` to page through a larger file rather than assuming you've seen the whole thing — the response tells you when it's been cut off.

## Keeping command output small

`run_command`'s output is capped (tail-truncated past ~20,000 characters) so one verbose command can't blow up the conversation — but it's cheaper and more useful to avoid needing the cap at all. Prefer a narrow command over a broad one when you only need part of the result: `tail -n 100 file.log` instead of `cat file.log`, `grep` for the specific line you need instead of dumping a whole config, `ps aux | grep <name>` instead of a full process list. If output comes back truncated, don't just re-run the same command — narrow it.

## Check for project-local command aliases first

If the user's project has a `.termloop/commands.json` (used by TermLoop's VS Code extension for a quick-command palette), prefer running the pre-defined command from there over improvising an equivalent one yourself — it's already been vetted for this project/connection, and some entries vary their actual command per-connection (e.g. a `restart` command that differs between a "Exostudy" server and everything else). Read that file if present before writing a shell command from scratch for a task it might already cover.
