import * as vscode from "vscode";
import { createClient, type TermLoopClient } from "@termloop/client";
import { ensureDaemon } from "./daemonManager.js";

export interface DaemonConnection {
  client: TermLoopClient;
  baseUrl: string;
}

let cached: DaemonConnection | undefined;
let inFlight: Promise<DaemonConnection> | undefined;

/**
 * Resolves the daemon connection, reusing a cached one once established. Retries
 * `ensureDaemon()` on every call while not yet connected — this is what lets a failed
 * first attempt (e.g. the daemon was slow to start) recover just by the user retrying
 * an action (or hitting the Refresh button), instead of the only way out being a full
 * "Reload Window". Activation itself never awaits this directly for that reason: it
 * registers every command/tree view unconditionally first, then attempts to connect.
 *
 * Concurrent callers (e.g. Refresh triggers all 3 tree views' getChildren() at once)
 * share one in-flight attempt rather than each independently racing `ensureDaemon()` —
 * which would otherwise risk spawning more than one daemon process at a time.
 */
export async function connectDaemon(): Promise<DaemonConnection> {
  if (cached) return cached;
  if (!inFlight) {
    inFlight = (async () => {
      const baseUrl = await ensureDaemon();
      const client = createClient({ baseUrl });
      cached = { client, baseUrl };
      return cached;
    })().finally(() => {
      inFlight = undefined;
    });
  }
  return inFlight;
}

/** Runs `fn` with a resolved daemon connection, showing a TermLoop-prefixed error
 * message (instead of throwing) if the connection can't be established. */
export async function withDaemon<T>(
  fn: (conn: DaemonConnection) => Promise<T> | T
): Promise<T | undefined> {
  try {
    const conn = await connectDaemon();
    return await fn(conn);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to TermLoop";
    vscode.window.showErrorMessage(`TermLoop: ${message}`);
    return undefined;
  }
}
