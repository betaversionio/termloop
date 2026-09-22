import * as vscode from "vscode";

export interface McpTargetItem {
  id: string;
  label: string;
  value: string;
}

function targets(baseUrl: string): McpTargetItem[] {
  const mcpUrl = `${baseUrl}/mcp`;
  return [
    { id: "claude", label: "Claude Code", value: `claude mcp add --transport http termloop ${mcpUrl}` },
    { id: "codex", label: "Codex", value: mcpUrl },
    { id: "manual", label: "Manual / Other Clients", value: mcpUrl },
  ];
}

export class McpTreeProvider implements vscode.TreeDataProvider<McpTargetItem> {
  constructor(private readonly baseUrl: string) {}

  getTreeItem(target: McpTargetItem): vscode.TreeItem {
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

  getChildren(): McpTargetItem[] {
    return targets(this.baseUrl);
  }
}
