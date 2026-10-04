import * as vscode from "vscode";
import { connectDaemon } from "./daemonConnection.js";

export interface McpTargetItem {
  id: string;
  label: string;
  value: string;
}

type Row = McpTargetItem | { placeholder: string };

function isPlaceholder(row: Row): row is { placeholder: string } {
  return "placeholder" in row;
}

function targets(baseUrl: string): McpTargetItem[] {
  const mcpUrl = `${baseUrl}/mcp`;
  return [
    { id: "claude", label: "Claude Code", value: `claude mcp add --transport http termloop ${mcpUrl}` },
    { id: "codex", label: "Codex", value: mcpUrl },
    { id: "manual", label: "Manual / Other Clients", value: mcpUrl },
  ];
}

export class McpTreeProvider implements vscode.TreeDataProvider<Row> {
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
    const target = row;
    const item = new vscode.TreeItem(target.label, vscode.TreeItemCollapsibleState.None);
    item.description = target.value;
    item.contextValue = "termloopMcpTarget";
    item.iconPath = new vscode.ThemeIcon("copy");
    item.tooltip = new vscode.MarkdownString(`Click to copy:\n\n\`${target.value}\``);
    item.command = {
      command: "termloop.copyMcpTarget",
      title: "Copy",
      arguments: [target],
    };
    return item;
  }

  async getChildren(): Promise<Row[]> {
    try {
      const { baseUrl } = await connectDaemon();
      return targets(baseUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Not connected";
      return [{ placeholder: `${message} — click to retry` }];
    }
  }
}
