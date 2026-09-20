import * as vscode from "vscode";
import type { RemoteFile, StackLaneClient } from "@stacklane/client";

function toFileType(type: RemoteFile["type"]): vscode.FileType {
  switch (type) {
    case "directory":
      return vscode.FileType.Directory;
    case "symlink":
      return vscode.FileType.SymbolicLink | vscode.FileType.File;
    default:
      return vscode.FileType.File;
  }
}

function parentPath(path: string): string {
  const trimmed = path.replace(/\/$/, "");
  const idx = trimmed.lastIndexOf("/");
  return idx <= 0 ? "/" : trimmed.slice(0, idx);
}

function baseName(path: string): string {
  const trimmed = path.replace(/\/$/, "");
  return trimmed.slice(trimmed.lastIndexOf("/") + 1);
}

export class StackLaneFsProvider implements vscode.FileSystemProvider {
  private readonly emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile = this.emitter.event;

  constructor(private readonly client: StackLaneClient) {}

  watch(): vscode.Disposable {
    // No push-based change notifications from the daemon yet.
    return new vscode.Disposable(() => {});
  }

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    const path = uri.path || "/";
    if (path === "/" || path === "") {
      return { type: vscode.FileType.Directory, ctime: 0, mtime: 0, size: 0 };
    }

    const entries = await this.client.sftp.list(uri.authority, parentPath(path));
    const match = entries.find((entry) => entry.name === baseName(path));
    if (!match) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
    return {
      type: toFileType(match.type),
      ctime: 0,
      mtime: new Date(match.modifiedAt).getTime(),
      size: match.size,
    };
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const entries = await this.client.sftp.list(uri.authority, uri.path || "/");
    return entries.map((entry) => [entry.name, toFileType(entry.type)]);
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    const content = await this.client.sftp.readFile(uri.authority, uri.path);
    return new TextEncoder().encode(content);
  }

  async writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void> {
    await this.client.sftp.writeFile(uri.authority, uri.path, new TextDecoder().decode(content));
    this.emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
  }

  async createDirectory(uri: vscode.Uri): Promise<void> {
    await this.client.sftp.mkdir(uri.authority, uri.path);
    this.emitter.fire([{ type: vscode.FileChangeType.Created, uri }]);
  }

  async delete(uri: vscode.Uri, options: { recursive: boolean }): Promise<void> {
    const stat = await this.stat(uri);
    await this.client.sftp.remove(uri.authority, uri.path, stat.type === vscode.FileType.Directory || options.recursive);
    this.emitter.fire([{ type: vscode.FileChangeType.Deleted, uri }]);
  }

  async rename(oldUri: vscode.Uri, newUri: vscode.Uri): Promise<void> {
    await this.client.sftp.rename(oldUri.authority, oldUri.path, newUri.path);
    this.emitter.fire([
      { type: vscode.FileChangeType.Deleted, uri: oldUri },
      { type: vscode.FileChangeType.Created, uri: newUri },
    ]);
  }
}
