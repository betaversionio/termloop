import * as vscode from "vscode";
import type { ServerConnection, TermLoopClient } from "@termloop/client";

export class ConnectionsTreeProvider implements vscode.TreeDataProvider<ServerConnection> {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;

  constructor(private readonly client: TermLoopClient) {}

  refresh(): void {
    this.emitter.fire();
  }

  getTreeItem(connection: ServerConnection): vscode.TreeItem {
    const item = new vscode.TreeItem(connection.name, vscode.TreeItemCollapsibleState.None);
    item.description = `${connection.username}@${connection.host}:${connection.port}`;
    item.contextValue = "termloopConnection";
    item.iconPath = new vscode.ThemeIcon("server");
    item.command = {
      command: "termloop.openTerminal",
      title: "Open Terminal",
      arguments: [connection],
    };
    return item;
  }

  async getChildren(): Promise<ServerConnection[]> {
    return this.client.connections.list();
  }
}
