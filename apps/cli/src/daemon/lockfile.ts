import fs from "fs";
import os from "os";
import path from "path";

export interface DaemonInfo {
  pid: number;
  port: number;
  startedAt: number;
}

const DATA_DIR = path.join(os.homedir(), ".stacklane");
const DAEMON_FILE = path.join(DATA_DIR, "daemon.json");

export function readDaemonFile(): DaemonInfo | null {
  try {
    const raw = fs.readFileSync(DAEMON_FILE, "utf-8");
    return JSON.parse(raw) as DaemonInfo;
  } catch {
    return null;
  }
}

export function writeDaemonFile(info: DaemonInfo): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DAEMON_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(info, null, 2));
  fs.renameSync(tmpFile, DAEMON_FILE);
}

/** Removes the lockfile only if it still points at this process, so a stale cleanup can't clobber a newer daemon. */
export function removeDaemonFileIfOwned(pid: number): void {
  const current = readDaemonFile();
  if (current && current.pid === pid) {
    try {
      fs.unlinkSync(DAEMON_FILE);
    } catch {
      // already gone
    }
  }
}
