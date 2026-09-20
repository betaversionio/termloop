import * as vscode from "vscode";

export interface CommandEntry {
  description?: string;
  /** A plain string runs everywhere; an object lets it differ per connection (id or name), with an optional "default". */
  command: string | Record<string, string>;
}

export type CommandManifest = Record<string, CommandEntry>;

export interface AliasResolution {
  command?: string;
  error?: string;
}

/** Looks up an alias for a specific connection. Returns undefined if `alias` isn't a known key at all —
 * callers should treat that as "not an alias, forward as typed" rather than an error. */
export function resolveAlias(
  manifest: CommandManifest,
  alias: string,
  connection: { id: string; name: string }
): AliasResolution | undefined {
  const entry = manifest[alias];
  if (entry === undefined) return undefined;
  if (typeof entry.command === "string") return { command: entry.command };

  const command = entry.command[connection.id] ?? entry.command[connection.name] ?? entry.command.default;
  if (command) return { command };
  return { error: `TermLoop: no command bound to alias "/${alias}" for connection "${connection.name}".` };
}

/** Reads .termloop/commands.json from the first local (file://) workspace folder that has one. */
export async function loadManifest(): Promise<CommandManifest> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  for (const folder of folders) {
    if (folder.uri.scheme !== "file") continue;

    const fileUri = vscode.Uri.joinPath(folder.uri, ".termloop", "commands.json");
    let bytes: Uint8Array;
    try {
      bytes = await vscode.workspace.fs.readFile(fileUri);
    } catch {
      continue; // not found in this folder — try the next
    }

    try {
      return JSON.parse(new TextDecoder().decode(bytes)) as CommandManifest;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showWarningMessage(`TermLoop: failed to parse ${fileUri.fsPath} — ${message}`);
      return {};
    }
  }
  return {};
}

/** Fires `onChange` whenever any workspace folder's .termloop/commands.json is created, edited, or removed. */
export function watchManifest(onChange: () => void): vscode.Disposable {
  const watcher = vscode.workspace.createFileSystemWatcher("**/.termloop/commands.json");
  return vscode.Disposable.from(
    watcher,
    watcher.onDidChange(onChange),
    watcher.onDidCreate(onChange),
    watcher.onDidDelete(onChange)
  );
}
