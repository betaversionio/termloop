import * as vscode from "vscode";
import { connectDaemon } from "./daemonConnection.js";

export interface SessionItem {
  sessionId: string;
  connectionId: string;
  connectionName: string;
}

type Row = SessionItem | { placeholder: string };

function isPlaceholder(row: Row): row is { placeholder: string } {
  return "placeholder" in row;
}

export class SessionsTreeProvider implements vscode.TreeDataProvider<Row> {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;

  refresh(): void {
    this.emitter.fire();
  }

  getTreeItem(row: Row): vscode.TreeItem {
    if (isPlaceholder(row)) {
      const item = new vscode.TreeItem(row.placeholder, vscode.TreeItemCollapsibleState.None);
      item.iconPath = new vscode.ThemeIcon("warning");
      item.command = { command: "termloop.refreshSessions", title: "Retry" };
      return item;
    }
    const session = row;
    const item = new vscode.TreeItem(session.connectionName, vscode.TreeItemCollapsibleState.None);
    item.description = session.sessionId.slice(0, 8);
    item.tooltip = `Session ${session.sessionId}`;
    item.contextValue = "termloopSession";
    item.iconPath = new vscode.ThemeIcon("terminal");
    item.command = {
      command: "termloop.attachSessionTerminal",
      title: "Attach",
      arguments: [session],
    };
    return item;
  }

  async getChildren(): Promise<Row[]> {
    try {
      const { client } = await connectDaemon();
      const [sessions, connections] = await Promise.all([
        client.terminal.listSessions(),
        client.connections.list(),
      ]);
      const names = new Map(connections.map((c) => [c.id, c.name]));
      return sessions.map((s) => ({
        sessionId: s.sessionId,
        connectionId: s.connectionId,
        connectionName: names.get(s.connectionId) ?? "(unknown)",
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Not connected";
      return [{ placeholder: `${message} — click to retry` }];
    }
  }
}
