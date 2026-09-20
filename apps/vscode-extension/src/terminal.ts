import * as vscode from "vscode";
import type { ServerConnection, TermLoopClient, TerminalHandle } from "@termloop/client";
import { resolveAlias, type LoadedManifest } from "./commandAliases.js";
import { AliasLineBuffer } from "./aliasLineBuffer.js";
import { uploadLocalScript } from "./localScriptRunner.js";

export function openTerminal(
  client: TermLoopClient,
  connection: ServerConnection,
  getManifest: () => LoadedManifest,
  sessionId?: string
): vscode.Terminal {
  const writeEmitter = new vscode.EventEmitter<string>();
  const closeEmitter = new vscode.EventEmitter<number | void>();
  const lineBuffer = new AliasLineBuffer();

  let handle: TerminalHandle | undefined;
  let pendingInput = "";

  const writeToRemote = (text: string) => {
    if (handle) {
      handle.write(text);
    } else {
      pendingInput += text;
    }
  };

  const runPendingLocalScript = async (pending: { alias: string; localScript: string; args: string }) => {
    const { folder } = getManifest();
    if (!folder) {
      writeEmitter.fire(`\r\nTermLoop: can't resolve local script — no workspace folder found.\r\n`);
      return;
    }
    try {
      const cmd = await uploadLocalScript(client, connection, folder, pending.alias, pending.localScript, pending.args);
      writeToRemote(cmd + "\r");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      writeEmitter.fire(`\r\nTermLoop: failed to upload "${pending.localScript}" — ${message}\r\n`);
    }
  };

  const feedInput = (data: string): string => {
    const { toRemote, toLocal, pendingLocalScript } = lineBuffer.feed(data, (alias) =>
      resolveAlias(getManifest().manifest, alias, connection)
    );
    if (toLocal) writeEmitter.fire(toLocal);
    if (pendingLocalScript) void runPendingLocalScript(pendingLocalScript);
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
      if (toRemote) writeToRemote(toRemote);
    },
    setDimensions(dimensions) {
      handle?.resize(dimensions.columns, dimensions.rows);
    },
  };

  const terminal = vscode.window.createTerminal({ name: connection.name, pty });
  terminal.show();
  return terminal;
}
