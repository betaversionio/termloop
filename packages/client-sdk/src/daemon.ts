import fs from "fs";
import os from "os";
import path from "path";

export interface DaemonInfo {
  pid: number;
  port: number;
  startedAt: number;
}

const DAEMON_FILE = path.join(os.homedir(), ".stacklane", "daemon.json");

export function readDaemonFile(): DaemonInfo | null {
  try {
    const raw = fs.readFileSync(DAEMON_FILE, "utf-8");
    return JSON.parse(raw) as DaemonInfo;
  } catch {
    return null;
  }
}

async function checkHealth(port: number, timeoutMs = 500): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/** Returns the port of an already-running, healthy StackLane daemon, or null if none is reachable. */
export async function findRunningDaemon(): Promise<{ port: number } | null> {
  const info = readDaemonFile();
  if (!info) return null;
  const healthy = await checkHealth(info.port);
  return healthy ? { port: info.port } : null;
}
