import { readDaemonFile, writeDaemonFile, removeDaemonFileIfOwned } from "./lockfile.js";

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

/** Records this process as the daemon and cleans up the lockfile on exit. */
export function registerAsDaemon(port: number): void {
  writeDaemonFile({ pid: process.pid, port, startedAt: Date.now() });

  const cleanup = () => removeDaemonFileIfOwned(process.pid);
  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
}
