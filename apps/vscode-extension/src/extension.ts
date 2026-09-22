import * as vscode from "vscode";
import { createClient, type ServerConnection, type ServerConnectionInput, type TermLoopClient } from "@termloop/client";
import { ensureDaemon } from "./daemonManager.js";
import { ConnectionsTreeProvider } from "./connectionsTreeProvider.js";
import { SessionsTreeProvider, type SessionItem } from "./sessionsTreeProvider.js";
import { McpTreeProvider, type McpTargetItem } from "./mcpTreeProvider.js";
import { openTerminal } from "./terminal.js";
import { TermLoopFsProvider } from "./fileSystemProvider.js";
import { loadManifest, watchManifest, resolveAlias, type CommandManifest } from "./commandAliases.js";
import { openOsDesktop } from "./osWebview.js";
import { uploadLocalScript } from "./localScriptRunner.js";

/** Prompts through the connection fields, pre-filled from `existing` when editing. For the
 * secret (password/private key), leaving it blank on an edit keeps the current value. */
async function promptForConnection(existing?: ServerConnection): Promise<ServerConnectionInput | undefined> {
  const name = await vscode.window.showInputBox({ prompt: "Connection name", value: existing?.name });
  if (!name) return undefined;

  const host = await vscode.window.showInputBox({ prompt: "Host", value: existing?.host });
  if (!host) return undefined;

  const portInput = await vscode.window.showInputBox({
    prompt: "Port",
    value: String(existing?.port ?? 22),
  });
  if (!portInput) return undefined;

  const username = await vscode.window.showInputBox({ prompt: "Username", value: existing?.username });
  if (!username) return undefined;

  const authMethod = await vscode.window.showQuickPick(["password", "key"], {
    placeHolder: "Authentication method",
  });
  if (!authMethod) return undefined;

  const tagsInput = await vscode.window.showInputBox({
    prompt: "Tags (comma-separated, optional)",
    value: existing?.tags?.join(", ") ?? "",
  });
  const tags = tagsInput
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const base = {
    name,
    host,
    port: parseInt(portInput, 10),
    username,
    authMethod: authMethod as "password" | "key",
    ...(tags && tags.length > 0 ? { tags } : {}),
  };

  if (authMethod === "password") {
    const password = await vscode.window.showInputBox({
      prompt: existing ? "Password (leave blank to keep the current one)" : "Password",
      password: true,
    });
    if (!password && !existing) return undefined;
    return password ? { ...base, password } : (base as ServerConnectionInput);
  }

  const privateKey = await vscode.window.showInputBox({
    prompt: existing ? "Private key (leave blank to keep the current one)" : "Private key (paste contents)",
    password: true,
  });
  if (!privateKey && !existing) return undefined;
  return privateKey ? { ...base, privateKey } : (base as ServerConnectionInput);
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

  const mcpProvider = new McpTreeProvider(baseUrl);
  context.subscriptions.push(vscode.window.registerTreeDataProvider("termloopMcp", mcpProvider));

  const fsProvider = new TermLoopFsProvider(client);
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider("termloop", fsProvider, { isCaseSensitive: true })
  );

  let commandManifest: CommandManifest;
  let manifestFolder: vscode.Uri | undefined;
  ({ manifest: commandManifest, folder: manifestFolder } = await loadManifest());
  context.subscriptions.push(
    watchManifest(async () => {
      ({ manifest: commandManifest, folder: manifestFolder } = await loadManifest());
    })
  );

  const terminalConnections = new Map<vscode.Terminal, ServerConnection>();
  context.subscriptions.push(
    vscode.window.onDidCloseTerminal((terminal) => {
      if (!terminalConnections.delete(terminal)) return;
      treeProvider.refresh();
      sessionsProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("termloop.refreshConnections", () => treeProvider.refresh()),

    vscode.commands.registerCommand("termloop.addConnection", async () => {
      const input = await promptForConnection();
      if (!input) return;
      await client.connections.create(input);
      treeProvider.refresh();
    }),

    vscode.commands.registerCommand("termloop.editConnection", async (connection: ServerConnection) => {
      const input = await promptForConnection(connection);
      if (!input) return;
      await client.connections.update(connection.id, input);
      treeProvider.refresh();
    }),

    vscode.commands.registerCommand("termloop.deleteConnection", async (connection: ServerConnection) => {
      const confirmed = await vscode.window.showWarningMessage(
        `Delete connection "${connection.name}"? This cannot be undone.`,
        { modal: true },
        "Delete"
      );
      if (confirmed !== "Delete") return;
      await client.connections.delete(connection.id);
      treeProvider.refresh();
    }),

    vscode.commands.registerCommand("termloop.openTerminal", (connection: ServerConnection) => {
      const terminal = openTerminal(client, connection, () => ({ manifest: commandManifest, folder: manifestFolder }));
      terminalConnections.set(terminal, connection);
      treeProvider.refresh();
      sessionsProvider.refresh();
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

    vscode.commands.registerCommand("termloop.copyMcpTarget", async (target: McpTargetItem) => {
      await vscode.env.clipboard.writeText(target.value);
      vscode.window.showInformationMessage(`Copied to clipboard: ${target.value}`);
    }),

    vscode.commands.registerCommand("termloop.refreshSessions", () => sessionsProvider.refresh()),

    vscode.commands.registerCommand("termloop.attachSessionTerminal", async (session: SessionItem) => {
      const connection = await client.connections.get(session.connectionId);
      const terminal = openTerminal(
        client,
        connection,
        () => ({ manifest: commandManifest, folder: manifestFolder }),
        session.sessionId
      );
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

      const alias = picked.label.slice(1);
      const result = resolveAlias(commandManifest, alias, connection);
      if (result?.command !== undefined) {
        terminal.sendText(result.command, true);
        return;
      }

      if (result?.localScript !== undefined) {
        if (!manifestFolder) {
          vscode.window.showErrorMessage("TermLoop: can't resolve local script — no workspace folder found.");
          return;
        }
        try {
          const cmd = await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `TermLoop: uploading ${result.localScript}...` },
            () => uploadLocalScript(client, connection, manifestFolder!, alias, result.localScript!)
          );
          terminal.sendText(cmd, true);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`TermLoop: failed to upload "${result.localScript}" — ${message}`);
        }
        return;
      }

      if (result?.error !== undefined) {
        vscode.window.showErrorMessage(result.error);
      }
    })
  );
}

export function deactivate(): void {
  // The daemon outlives the extension host, same as the web UI.
}
