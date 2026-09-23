# TODO

Feature ideas, not yet scoped or committed to.

- [ ] **Command palette (Cmd+K)** — a single fast search across connections, apps, and widgets, instead of three separate entry points (Dock, Launchpad, connection list).
- [ ] **Split panes / tabs within one terminal window** — let one window hold multiple SSH sessions/panes (iTerm2/Windows Terminal style) instead of every session opening its own window.
- [ ] **SSH tunnel / port-forward manager UI** — a GUI for setting up and managing local/remote port forwards per connection.
- [ ] **Historical stats graphs** — store a rolling local history for the Server Stats widget and graph CPU/mem/disk over time instead of just showing live numbers.
- [ ] **Session recording/replay** (asciinema-style) — record a terminal session, replay or share it later for debugging/onboarding.
- [ ] **Marketing website** — a proper landing page for TermLoop.
- [ ] **Mention the VS Code extension in the web app** — link/promote it somewhere in the web UI (e.g. Settings) for people who only know the web/CLI side.
- [ ] **Hosted server for the OS marketplace** — a real backend + DB for the app/widget catalog (submit via API, list via API) instead of the current PR-to-this-repo static `catalog.json`/`widgets-catalog.json` model. See the marketplace design discussion earlier in this session for the tradeoffs (esp. code-review/integrity loss if bundles are self-hosted).
- [ ] **`.yml` for server setup** — a declarative config file format for provisioning/setting up a connected server (installing packages, configuring services), runnable from TermLoop.

## New built-in OS apps

- [ ] **Systemd Services Manager** — list/start/stop/enable/restart services and tail their logs, without memorizing `systemctl` incantations.
- [ ] **Logs Viewer** — tail/search `journalctl` and `/var/log`, with filtering and live streaming.
- [ ] **Process Manager** — an interactive `htop`-like list with kill/renice actions, more actionable than Activity Monitor's read-only stats.
- [ ] **Package Manager** — browse/install/update apt/yum/dnf packages through a GUI.
- [ ] **Firewall Manager** — a GUI over ufw/iptables rules.
- [ ] **Users & SSH Keys Manager** — view/manage system users, groups, sudoers, and `authorized_keys`.
- [ ] **Database client** — connect to a Postgres/MySQL/Redis instance running on the server and browse/query it, lightweight TablePlus-style.
