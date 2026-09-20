import * as vscode from "vscode";
import { createClient, type ServerConnection, type ServerConnectionInput, type TermLoopClient } from "@termloop/client";
import { ensureDaemon } from "./daemonManager.js";
import { ConnectionsTreeProvider } from "./connectionsTreeProvider.js";
import { openTerminal } from "./terminal.js";
import { TermLoopFsProvider } from "./fileSystemProvider.js";

async function promptForConnection(): Promise<ServerConnectionInput | undefined> {
  const name = await vscode.window.showInputBox({ prompt: "Connection name" });
  if (!name) return undefined;

  const host = await vscode.window.showInputBox({ prompt: "Host" });
  if (!host) return undefined;

  const portInput = await vscode.window.showInputBox({ prompt: "Port", value: "22" });
  if (!portInput) return undefined;

  const username = await vscode.window.showInputBox({ prompt: "Username" });
  if (!username) return undefined;

  const authMethod = await vscode.window.showQuickPick(["password", "key"], {
    placeHolder: "Authentication method",
  });
  if (!authMethod) return undefined;

  const base = {
    name,
    host,
    port: parseInt(portInput, 10),
    username,
    authMethod: authMethod as "password" | "key",
  };

  if (authMethod === "password") {
    const password = await vscode.window.showInputBox({ prompt: "Password", password: true });
    if (!password) return undefined;
    return { ...base, password };
  }

  const privateKey = await vscode.window.showInputBox({ prompt: "Private key (paste contents)", password: true });
  if (!privateKey) return undefined;
  return { ...base, privateKey };
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  let client: TermLoopClient;
  try {
    const baseUrl = await ensureDaemon();
    client = createClient({ baseUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to TermLoop";
    vscode.window.showErrorMessage(`TermLoop: ${message}`);
    return;
  }

  const treeProvider = new ConnectionsTreeProvider(client);
  context.subscriptions.push(vscode.window.registerTreeDataProvider("termloopConnections", treeProvider));

  const fsProvider = new TermLoopFsProvider(client);
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider("termloop", fsProvider, { isCaseSensitive: true })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("termloop.refreshConnections", () => treeProvider.refresh()),

    vscode.commands.registerCommand("termloop.addConnection", async () => {
      const input = await promptForConnection();
      if (!input) return;
      await client.connections.create(input);
      treeProvider.refresh();
    }),

    vscode.commands.registerCommand("termloop.openTerminal", (connection: ServerConnection) => {
      openTerminal(client, connection);
    }),

    vscode.commands.registerCommand("termloop.browseFiles", (connection: ServerConnection) => {
      vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders?.length ?? 0, 0, {
        uri: vscode.Uri.parse(`termloop://${connection.id}/`),
        name: connection.name,
      });
    })
  );
}

export function deactivate(): void {
  // The daemon outlives the extension host, same as the web UI.
}
