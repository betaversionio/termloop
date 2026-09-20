import * as vscode from "vscode";

export interface CommandEntry {
  description?: string;
  /** A plain string runs everywhere; an object lets it differ per connection (id or name), with an optional "default". */
  command?: string | Record<string, string>;
  /** Like `command`, but a path (relative to the workspace folder) to a local .sh file — uploaded to the
   * remote server and run there, instead of needing the script to already exist remotely. */
  localScript?: string | Record<string, string>;
}

export type CommandManifest = Record<string, CommandEntry>;

export interface LoadedManifest {
  manifest: CommandManifest;
  /** The workspace folder commands.json was found in — `localScript` paths resolve relative to this. */
  folder?: vscode.Uri;
}

export interface AliasResolution {
  command?: string;
  /** A local file path (relative to the manifest's workspace folder) still needing to be uploaded before it can run. */
  localScript?: string;
  error?: string;
}

function resolveField(
  field: string | Record<string, string> | undefined,
  connection: { id: string; name: string }
): string | undefined {
  if (field === undefined) return undefined;
  if (typeof field === "string") return field;
  return field[connection.id] ?? field[connection.name] ?? field.default;
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

  const command = resolveField(entry.command, connection);
  if (command !== undefined) return { command };

  const localScript = resolveField(entry.localScript, connection);
  if (localScript !== undefined) return { localScript };

  if (entry.command !== undefined || entry.localScript !== undefined) {
    return { error: `TermLoop: no command bound to alias "/${alias}" for connection "${connection.name}".` };
  }
  return { error: `TermLoop: alias "/${alias}" has neither a command nor a localScript configured.` };
}

/** Reads .termloop/commands.json from the first local (file://) workspace folder that has one. */
export async function loadManifest(): Promise<LoadedManifest> {
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
      const manifest = JSON.parse(new TextDecoder().decode(bytes)) as CommandManifest;
      return { manifest, folder: folder.uri };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showWarningMessage(`TermLoop: failed to parse ${fileUri.fsPath} — ${message}`);
      return { manifest: {} };
    }
  }
  return { manifest: {} };
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
