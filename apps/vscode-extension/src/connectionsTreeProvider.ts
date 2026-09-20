import * as vscode from "vscode";
import type { ServerConnection, StackLaneClient } from "@stacklane/client";

export class ConnectionsTreeProvider implements vscode.TreeDataProvider<ServerConnection> {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;

  constructor(private readonly client: StackLaneClient) {}

  refresh(): void {
    this.emitter.fire();
  }

  getTreeItem(connection: ServerConnection): vscode.TreeItem {
    const item = new vscode.TreeItem(connection.name, vscode.TreeItemCollapsibleState.None);
    item.description = `${connection.username}@${connection.host}:${connection.port}`;
    item.contextValue = "stacklaneConnection";
    item.iconPath = new vscode.ThemeIcon("server");
    item.command = {
      command: "stacklane.openTerminal",
      title: "Open Terminal",
      arguments: [connection],
    };
    return item;
  }

  async getChildren(): Promise<ServerConnection[]> {
    return this.client.connections.list();
  }
}
