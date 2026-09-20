import * as vscode from "vscode";
import { spawn } from "child_process";
import { findRunningDaemon } from "@termloop/client";

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 15000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function spawnDaemon(): void {
  const child = spawn("termloop", ["--no-open"], { detached: true, stdio: "ignore" });
  child.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") {
      spawn("npx", ["--yes", "termloop", "--no-open"], { detached: true, stdio: "ignore" }).unref();
    }
  });
  child.unref();
}

async function waitForDaemon(): Promise<string | null> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const found = await findRunningDaemon();
    if (found) return `http://localhost:${found.port}`;
    await sleep(POLL_INTERVAL_MS);
  }
  return null;
}

/** Finds a running TermLoop daemon, prompting the user to start one if none is found. */
export async function ensureDaemon(): Promise<string> {
  const existing = await findRunningDaemon();
  if (existing) {
    return `http://localhost:${existing.port}`;
  }

  const choice = await vscode.window.showInformationMessage(
    "TermLoop isn't running.",
    "Start"
  );
  if (choice !== "Start") {
    throw new Error("TermLoop daemon is not running");
  }

  spawnDaemon();
  const url = await waitForDaemon();
  if (!url) {
    throw new Error("Timed out waiting for the TermLoop daemon to start");
  }
  return url;
}
