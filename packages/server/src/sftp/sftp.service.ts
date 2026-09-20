import { Injectable, Inject } from "@nestjs/common";
import type { SFTPWrapper } from "ssh2";
import type { RemoteFile } from "@termloop/shared";
import { StoreService } from "../store/store.service.js";
import { SshService } from "../ssh/ssh.service.js";

@Injectable()
export class SftpService {
  private activeSFTP = new Map<string, SFTPWrapper>();

  constructor(
    @Inject(StoreService) private readonly store: StoreService,
    @Inject(SshService) private readonly ssh: SshService
  ) {}

  async getSFTP(connectionId: string): Promise<SFTPWrapper> {
    const existing = this.activeSFTP.get(connectionId);
    if (existing) return existing;

    const config = this.store.servers.findById(connectionId);
    if (!config) {
      throw new Error('Connection not found');
    }

    const client = await this.ssh.createSSHConnection(config);
    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }
        sftp.on("close", () => this.activeSFTP.delete(connectionId));
        sftp.on("end", () => this.activeSFTP.delete(connectionId));
        this.activeSFTP.set(connectionId, sftp);
        resolve(sftp);
      });
    });
  }

  async listDirectory(connectionId: string, dirPath: string): Promise<RemoteFile[]> {
    const sftp = await this.getSFTP(connectionId);
    return new Promise((resolve, reject) => {
      sftp.readdir(dirPath, (err, list) => {
        if (err) {
          reject(err);
          return;
        }

        const files: RemoteFile[] = list.map((item) => {
          const isDir = (item.attrs.mode! & 0o40000) !== 0;
          const isLink = (item.attrs.mode! & 0o120000) === 0o120000;
          return {
            name: item.filename,
            path: dirPath === "/" ? `/${item.filename}` : `${dirPath}/${item.filename}`,
            type: isLink ? "symlink" : isDir ? "directory" : "file",
            size: item.attrs.size ?? 0,
            modifiedAt: new Date((item.attrs.mtime ?? 0) * 1000).toISOString(),
            permissions: formatPermissions(item.attrs.mode ?? 0),
            owner: String(item.attrs.uid ?? ""),
            group: String(item.attrs.gid ?? ""),
          };
        });

        files.sort((a, b) => {
          if (a.type === "directory" && b.type !== "directory") return -1;
          if (a.type !== "directory" && b.type === "directory") return 1;
          return a.name.localeCompare(b.name);
        });

        resolve(files);
      });
    });
  }

  async deleteFile(connectionId: string, filePath: string, isDir: boolean): Promise<void> {
    const sftp = await this.getSFTP(connectionId);
    if (isDir) {
      await this.rmdirRecursive(sftp, filePath);
    } else {
      return new Promise((resolve, reject) => {
        sftp.unlink(filePath, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  private async rmdirRecursive(sftp: SFTPWrapper, dirPath: string): Promise<void> {
    const entries = await new Promise<{ filename: string; attrs: { mode?: number } }[]>(
      (resolve, reject) => {
        sftp.readdir(dirPath, (err, list) => {
          if (err) reject(err);
          else resolve(list);
        });
      }
    );

    for (const entry of entries) {
      const fullPath = dirPath === "/" ? `/${entry.filename}` : `${dirPath}/${entry.filename}`;
      const isSubDir = ((entry.attrs.mode ?? 0) & 0o40000) !== 0;

      if (isSubDir) {
        await this.rmdirRecursive(sftp, fullPath);
      } else {
        await new Promise<void>((resolve, reject) => {
          sftp.unlink(fullPath, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    }

    await new Promise<void>((resolve, reject) => {
      sftp.rmdir(dirPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async collectAllFiles(
    connectionId: string,
    dirPath: string
  ): Promise<string[]> {
    const sftp = await this.getSFTP(connectionId);
    const results: string[] = [];
    await this.walkDir(sftp, dirPath, results);
    return results;
  }

  private async walkDir(
    sftp: SFTPWrapper,
    dirPath: string,
    results: string[]
  ): Promise<void> {
    const entries = await new Promise<{ filename: string; attrs: { mode?: number } }[]>(
      (resolve, reject) => {
        sftp.readdir(dirPath, (err, list) => {
          if (err) reject(err);
          else resolve(list);
        });
      }
    );

    for (const entry of entries) {
      const fullPath = dirPath === "/" ? `/${entry.filename}` : `${dirPath}/${entry.filename}`;
      const isSubDir = ((entry.attrs.mode ?? 0) & 0o40000) !== 0;

      if (isSubDir) {
        await this.walkDir(sftp, fullPath, results);
      } else {
        results.push(fullPath);
      }
    }
  }

  async rename(connectionId: string, oldPath: string, newPath: string): Promise<void> {
    const sftp = await this.getSFTP(connectionId);
    return new Promise((resolve, reject) => {
      sftp.rename(oldPath, newPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async mkdir(connectionId: string, dirPath: string): Promise<void> {
    const sftp = await this.getSFTP(connectionId);
    return new Promise((resolve, reject) => {
      sftp.mkdir(dirPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async readFile(connectionId: string, filePath: string): Promise<string> {
    const sftp = await this.getSFTP(connectionId);
    return new Promise((resolve, reject) => {
      const stream = sftp.createReadStream(filePath);
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      stream.on("error", reject);
    });
  }

  async writeFile(connectionId: string, filePath: string, content: string): Promise<void> {
    const sftp = await this.getSFTP(connectionId);
    return new Promise((resolve, reject) => {
      const stream = sftp.createWriteStream(filePath);
      stream.on("close", () => resolve());
      stream.on("error", reject);
      stream.end(Buffer.from(content, "utf-8"));
    });
  }
}

function formatPermissions(mode: number): string {
  const perms = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];
  const owner = perms[(mode >> 6) & 7];
  const group = perms[(mode >> 3) & 7];
  const other = perms[mode & 7];
  return `${owner}${group}${other}`;
}
