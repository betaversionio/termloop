import * as vscode from "vscode";
import type { ServerConnection, TermLoopClient } from "@termloop/client";

/**
 * Uploads a local .sh script via SFTP to a temp path on the remote server and returns the
 * command that runs it and cleans up afterward. Throws if the local file can't be read or the
 * upload fails — callers decide how to surface that.
 */
export async function uploadLocalScript(
  client: TermLoopClient,
  connection: ServerConnection,
  folder: vscode.Uri,
  alias: string,
  localScriptPath: string,
  args?: string
): Promise<string> {
  const scriptUri = vscode.Uri.joinPath(folder, localScriptPath);
  const bytes = await vscode.workspace.fs.readFile(scriptUri);
  const content = new TextDecoder().decode(bytes);

  const safeName = alias.replace(/[^a-zA-Z0-9_-]/g, "_");
  const remotePath = `/tmp/.termloop-${safeName}-${Date.now()}.sh`;
  await client.sftp.writeFile(connection.id, remotePath, content);

  const suffix = args ? ` ${args}` : "";
  return `bash "${remotePath}"${suffix}; rm -f "${remotePath}"`;
}
