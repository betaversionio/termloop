import * as vscode from "vscode";
import type { ServerConnection, StackLaneClient, TerminalHandle } from "@stacklane/client";

export function openTerminal(client: StackLaneClient, connection: ServerConnection): void {
  const writeEmitter = new vscode.EventEmitter<string>();
  const closeEmitter = new vscode.EventEmitter<number | void>();

  let handle: TerminalHandle | undefined;
  let pendingInput = "";

  const pty: vscode.Pseudoterminal = {
    onDidWrite: writeEmitter.event,
    onDidClose: closeEmitter.event,
    async open(dimensions) {
      try {
        handle = await client.terminal.open(connection.id, {
          cols: dimensions?.columns ?? 80,
          rows: dimensions?.rows ?? 24,
        });
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
      if (handle) {
        handle.write(data);
      } else {
        pendingInput += data;
      }
    },
    setDimensions(dimensions) {
      handle?.resize(dimensions.columns, dimensions.rows);
    },
  };

  const terminal = vscode.window.createTerminal({ name: connection.name, pty });
  terminal.show();
}
