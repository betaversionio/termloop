import * as vscode from "vscode";
import type { TermLoopClient } from "@termloop/client";

export interface SessionItem {
  sessionId: string;
  connectionId: string;
  connectionName: string;
}

export class SessionsTreeProvider implements vscode.TreeDataProvider<SessionItem> {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;

  constructor(private readonly client: TermLoopClient) {}

  refresh(): void {
    this.emitter.fire();
  }

  getTreeItem(session: SessionItem): vscode.TreeItem {
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

  async getChildren(): Promise<SessionItem[]> {
    const [sessions, connections] = await Promise.all([
      this.client.terminal.listSessions(),
      this.client.connections.list(),
    ]);
    const names = new Map(connections.map((c) => [c.id, c.name]));
    return sessions.map((s) => ({
      sessionId: s.sessionId,
      connectionId: s.connectionId,
      connectionName: names.get(s.connectionId) ?? "(unknown)",
    }));
  }
}
