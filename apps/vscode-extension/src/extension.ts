import * as vscode from "vscode";
import { createClient, type ServerConnection, type ServerConnectionInput, type TermLoopClient } from "@termloop/client";
import { ensureDaemon } from "./daemonManager.js";
import { ConnectionsTreeProvider } from "./connectionsTreeProvider.js";
import { SessionsTreeProvider, type SessionItem } from "./sessionsTreeProvider.js";
import { openTerminal } from "./terminal.js";
import { TermLoopFsProvider } from "./fileSystemProvider.js";
import { loadManifest, watchManifest, resolveAlias, type CommandManifest } from "./commandAliases.js";
import { openOsDesktop } from "./osWebview.js";

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
  let baseUrl: string;
  try {
    baseUrl = await ensureDaemon();
    client = createClient({ baseUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to TermLoop";
    vscode.window.showErrorMessage(`TermLoop: ${message}`);
    return;
  }

  const treeProvider = new ConnectionsTreeProvider(client);
  context.subscriptions.push(vscode.window.registerTreeDataProvider("termloopConnections", treeProvider));

  const sessionsProvider = new SessionsTreeProvider(client);
  context.subscriptions.push(vscode.window.registerTreeDataProvider("termloopSessions", sessionsProvider));

  const fsProvider = new TermLoopFsProvider(client);
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider("termloop", fsProvider, { isCaseSensitive: true })
  );

  let commandManifest: CommandManifest = await loadManifest();
  context.subscriptions.push(
    watchManifest(async () => {
      commandManifest = await loadManifest();
    })
  );

  const terminalConnections = new Map<vscode.Terminal, ServerConnection>();
  context.subscriptions.push(
    vscode.window.onDidCloseTerminal((terminal) => terminalConnections.delete(terminal))
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
      const terminal = openTerminal(client, connection, () => commandManifest);
      terminalConnections.set(terminal, connection);
    }),

    vscode.commands.registerCommand("termloop.browseFiles", (connection: ServerConnection) => {
      vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders?.length ?? 0, 0, {
        uri: vscode.Uri.parse(`termloop://${connection.id}/`),
        name: connection.name,
      });
    }),

    vscode.commands.registerCommand("termloop.openConnectionInBrowser", (connection: ServerConnection) => {
      vscode.env.openExternal(vscode.Uri.parse(`${baseUrl}/server/${connection.id}/terminal`));
    }),

    vscode.commands.registerCommand("termloop.openOsDesktop", (connection: ServerConnection) => {
      openOsDesktop(baseUrl, connection);
    }),

    vscode.commands.registerCommand("termloop.copyMcpConnectCommand", async () => {
      const command = `claude mcp add --transport http termloop ${baseUrl}/mcp`;
      await vscode.env.clipboard.writeText(command);
      vscode.window.showInformationMessage(`Copied to clipboard: ${command}`);
    }),

    vscode.commands.registerCommand("termloop.refreshSessions", () => sessionsProvider.refresh()),

    vscode.commands.registerCommand("termloop.attachSessionTerminal", async (session: SessionItem) => {
      const connection = await client.connections.get(session.connectionId);
      const terminal = openTerminal(client, connection, () => commandManifest, session.sessionId);
      terminalConnections.set(terminal, connection);
    }),

    vscode.commands.registerCommand("termloop.copySessionId", async (session: SessionItem) => {
      await vscode.env.clipboard.writeText(session.sessionId);
      vscode.window.showInformationMessage(`Copied session id: ${session.sessionId}`);
    }),

    vscode.commands.registerCommand("termloop.openSessionInBrowser", (session: SessionItem) => {
      vscode.env.openExternal(vscode.Uri.parse(`${baseUrl}/server/${session.connectionId}/terminal`));
    }),

    vscode.commands.registerCommand("termloop.insertCommandAlias", async () => {
      const terminal = vscode.window.activeTerminal;
      const connection = terminal && terminalConnections.get(terminal);
      if (!terminal || !connection) {
        vscode.window.showErrorMessage("TermLoop: no active TermLoop terminal.");
        return;
      }

      const aliases = Object.entries(commandManifest);
      if (aliases.length === 0) {
        vscode.window.showInformationMessage("TermLoop: no command aliases defined (.termloop/commands.json).");
        return;
      }

      const picked = await vscode.window.showQuickPick(
        aliases.map(([alias, entry]) => ({ label: `/${alias}`, description: entry.description })),
        { placeHolder: "Select a command alias to run" }
      );
      if (!picked) return;

      const result = resolveAlias(commandManifest, picked.label.slice(1), connection);
      if (result?.command !== undefined) {
        terminal.sendText(result.command, true);
      } else if (result?.error !== undefined) {
        vscode.window.showErrorMessage(result.error);
      }
    })
  );
}

export function deactivate(): void {
  // The daemon outlives the extension host, same as the web UI.
}
