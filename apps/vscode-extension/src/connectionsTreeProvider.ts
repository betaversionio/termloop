import * as vscode from "vscode";
import type { ServerConnection, TermLoopClient } from "@termloop/client";

export type ConnectionItem = ServerConnection & { isActive: boolean };

export class ConnectionsTreeProvider implements vscode.TreeDataProvider<ConnectionItem> {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;

  constructor(private readonly client: TermLoopClient) {}

  refresh(): void {
    this.emitter.fire();
  }

  getTreeItem(connection: ConnectionItem): vscode.TreeItem {
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

  async getChildren(): Promise<ConnectionItem[]> {
    const [connections, sessions] = await Promise.all([
      this.client.connections.list(),
      this.client.terminal.listSessions(),
    ]);
    const activeIds = new Set(sessions.map((s) => s.connectionId));
    return [...connections]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ ...c, isActive: activeIds.has(c.id) }));
  }
}
