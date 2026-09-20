import * as vscode from "vscode";
import type { ServerConnection } from "@termloop/client";

const panels = new Map<string, vscode.WebviewPanel>();

function nonce(): string {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) text += chars.charAt(Math.floor(Math.random() * chars.length));
  return text;
}

/**
 * Opens the existing web app's OS desktop (window manager, terminal/files/monitor/browser apps,
 * all fully working already) inside a VS Code webview panel, via an iframe pointed at the daemon.
 * Reuses the feature as-is rather than reimplementing it — the daemon already serves it.
 */
export function openOsDesktop(baseUrl: string, connection: ServerConnection): void {
  const existing = panels.get(connection.id);
  if (existing) {
    existing.reveal();
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    "termloopOs",
    `OS: ${connection.name}`,
    vscode.ViewColumn.Active,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  const cspNonce = nonce();
  const osUrl = `${baseUrl}/server/${connection.id}/os`;

  panel.webview.html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${baseUrl}; style-src 'nonce-${cspNonce}';">
  <style nonce="${cspNonce}">
    html, body, iframe { margin: 0; padding: 0; width: 100%; height: 100%; border: 0; display: block; }
  </style>
</head>
<body>
  <iframe src="${osUrl}"></iframe>
</body>
</html>`;

  panels.set(connection.id, panel);
  panel.onDidDispose(() => panels.delete(connection.id));
}
