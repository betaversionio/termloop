import * as vscode from "vscode";
import type { ServerConnection } from "@termloop/client";
import { connectDaemon } from "./daemonConnection.js";

export type ConnectionItem = ServerConnection & { isActive: boolean };

type Row = ConnectionItem | { placeholder: string };

function isPlaceholder(row: Row): row is { placeholder: string } {
  return "placeholder" in row;
}

export class ConnectionsTreeProvider implements vscode.TreeDataProvider<Row> {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;

  refresh(): void {
    this.emitter.fire();
  }

  getTreeItem(row: Row): vscode.TreeItem {
    if (isPlaceholder(row)) {
      const item = new vscode.TreeItem(row.placeholder, vscode.TreeItemCollapsibleState.None);
      item.iconPath = new vscode.ThemeIcon("warning");
      item.command = { command: "termloop.refreshConnections", title: "Retry" };
      return item;
    }
    const connection = row;
    const item = new vscode.TreeItem(connection.name, vscode.TreeItemCollapsibleState.None);
    const address = `${connection.username}@${connection.host}:${connection.port}`;
    const tags = connection.tags ?? [];

    item.description = tags.length > 0 ? `${address} · ${tags.join(", ")}` : address;
    item.contextValue = "termloopConnection";
    item.iconPath = new vscode.ThemeIcon(
      connection.authMethod === "key" ? "key" : "server",
      connection.isActive ? new vscode.ThemeColor("charts.green") : undefined
    );

    const tooltip = new vscode.MarkdownString();
    tooltip.appendMarkdown(`**${connection.name}**\n\n`);
    tooltip.appendMarkdown(`${address}\n\n`);
    tooltip.appendMarkdown(
      `Auth: ${connection.authMethod === "key" ? "SSH key" : "Password"}\n\n`
    );
    if (connection.isActive) {
      tooltip.appendMarkdown(`Status: 🟢 Active session\n\n`);
    }
    if (tags.length > 0) {
      tooltip.appendMarkdown(`Tags: ${tags.join(", ")}`);
    }
    item.tooltip = tooltip;

    item.command = {
      command: "termloop.openTerminal",
      title: "Open Terminal",
      arguments: [connection],
    };
    return item;
  }

  async getChildren(): Promise<Row[]> {
    try {
      const { client } = await connectDaemon();
      const [connections, sessions] = await Promise.all([
        client.connections.list(),
        client.terminal.listSessions(),
      ]);
      const activeIds = new Set(sessions.map((s) => s.connectionId));
      return [...connections]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => ({ ...c, isActive: activeIds.has(c.id) }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Not connected";
      return [{ placeholder: `${message} — click to retry` }];
    }
  }
}
