export { findRunningDaemon } from "@stacklane/client";
import { writeDaemonFile, removeDaemonFileIfOwned } from "./lockfile.js";

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
