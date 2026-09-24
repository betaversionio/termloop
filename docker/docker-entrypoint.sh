#!/bin/sh
set -e

# `exec` replaces this shell with the node process (instead of running it as a child),
# so it becomes PID 1 itself and receives SIGTERM/SIGINT directly from `docker stop` —
# a plain shell-form CMD would leave the shell as PID 1 and swallow those signals,
# forcing Docker to wait out the full stop timeout and SIGKILL the container instead.
exec npx --yes termloop --no-open --port "${PORT:-3721}"
