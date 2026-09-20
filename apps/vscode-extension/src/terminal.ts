import * as vscode from "vscode";
import type { ServerConnection, TermLoopClient, TerminalHandle } from "@termloop/client";
import { resolveAlias, type CommandManifest } from "./commandAliases.js";
import { AliasLineBuffer } from "./aliasLineBuffer.js";

export function openTerminal(
  client: TermLoopClient,
  connection: ServerConnection,
  getManifest: () => CommandManifest,
  sessionId?: string
): vscode.Terminal {
  const writeEmitter = new vscode.EventEmitter<string>();
  const closeEmitter = new vscode.EventEmitter<number | void>();
  const lineBuffer = new AliasLineBuffer();

  let handle: TerminalHandle | undefined;
  let pendingInput = "";

  const feedInput = (data: string): string => {
    const { toRemote, toLocal } = lineBuffer.feed(data, (alias) =>
      resolveAlias(getManifest(), alias, connection)
    );
    if (toLocal) writeEmitter.fire(toLocal);
    return toRemote;
  };

  const pty: vscode.Pseudoterminal = {
    onDidWrite: writeEmitter.event,
    onDidClose: closeEmitter.event,
    async open(dimensions) {
      try {
        const cols = dimensions?.columns ?? 80;
        const rows = dimensions?.rows ?? 24;
        // Attach to an already-open session for this connection if one exists (e.g. one
        // opened via the open_terminal MCP tool) rather than always starting a new shell.
        handle =
          (await client.terminal.attachToActiveSession(connection.id, sessionId)) ??
          (await client.terminal.open(connection.id, { cols, rows }));
        handle.onData((data) => writeEmitter.fire(data));
        handle.onClose(() => closeEmitter.fire());
        if (pendingInput) {
          handle.write(pendingInput);
          pendingInput = "";
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to open terminal";
        writeEmitter.fire(`\r\n${message}\r\n`);
        closeEmitter.fire(1);
      }
    },
    close() {
      handle?.close();
    },
    handleInput(data) {
      const toRemote = feedInput(data);
      if (!toRemote) return;
      if (handle) {
        handle.write(toRemote);
      } else {
        pendingInput += toRemote;
      }
    },
    setDimensions(dimensions) {
      handle?.resize(dimensions.columns, dimensions.rows);
    },
  };

  const terminal = vscode.window.createTerminal({ name: connection.name, pty });
  terminal.show();
  return terminal;
}
