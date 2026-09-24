#!/usr/bin/env node

import { Command } from "commander";
import open from "open";
import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import express, { type Request, type Response, type NextFunction } from "express";
import { findRunningDaemon, registerAsDaemon } from "./daemon/discover.js";
import { dynamicImport } from "./dynamicImport.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read from package.json rather than hardcoding, so `termloop --version` can't drift
// out of sync with the actual published version. dist/index.js always ships one
// directory below package.json, both when run from the repo and after npm install.
const { version } = JSON.parse(
  readFileSync(path.join(__dirname, "../package.json"), "utf-8")
) as { version: string };

const program = new Command();

program
  .name("termloop")
  .description("Browser-based OS-like UI for managing remote servers via SSH")
  .version(version)
  .option("-p, --port <number>", "Port to run on", "3721")
  .option("--no-open", "Don't open browser automatically")
  .action(async (opts) => {
    const port = parseInt(opts.port);

    const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
    const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
    const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
    const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

    console.log(`\n  ${dim("Starting")} ${bold(cyan("TermLoop"))}${dim("...")}\n`);

    const existing = await findRunningDaemon();
    if (existing) {
      const url = `http://localhost:${existing.port}`;
      console.log(`  ${green("Already running")} at ${cyan(url)}\n`);
      if (opts.open !== false) {
        open(url);
      }
      return;
    }

    // Dynamic import from bundled server directory (inside dist/)
    const { createApp } = await dynamicImport("./server/main.js");
    const { app, server, init } = await createApp(port);

    // Static files must be registered BEFORE NestJS init,
    // otherwise NestJS's 404 handler intercepts them
    const webDist = path.resolve(__dirname, "web");
    app.use(express.static(webDist));

    // SPA catch-all: serve index.html for client-side routes,
    // but let /api and /mcp requests fall through to NestJS
    app.get("{*path}", (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith("/api") || req.path === "/mcp") {
        return next();
      }
      // Pass "index.html" + { root } rather than a joined absolute path — express's
      // sendFile (via the `send` package) treats every segment of an absolute path as
      // subject to its dotfile check when no root is given, and npx's cache lives under
      // "~/.npm/_npx/...", so "index.html" would 404 there for every real `npx termloop` user.
      res.sendFile("index.html", { root: webDist });
    });

    await init();

    server.once("error", async (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        // Another process won the race to become the daemon since our check above.
        const raced = await findRunningDaemon();
        if (raced) {
          const url = `http://localhost:${raced.port}`;
          console.log(`  ${green("Already running")} at ${cyan(url)}\n`);
          if (opts.open !== false) open(url);
          return;
        }
      }
      console.error(`  Failed to start: ${err.message}`);
      process.exit(1);
    });

    server.listen(port, () => {
      registerAsDaemon(port);
      const url = `http://localhost:${port}`;
      console.log(`  ${green("Ready!")} ${bold("TermLoop")} is running at ${cyan(url)}`);
      console.log(`\n  ${dim("Press")} ${dim(bold("Ctrl+C"))} ${dim("to stop")}\n`);

      if (opts.open !== false) {
        open(url);
      }
    });
  });

program
  .command("mcp")
  .description("Start the MCP server so an AI CLI can drive your SSH connections")
  .option("-p, --port <number>", "Daemon port to use if one needs to be started", "3721")
  .action(async (opts) => {
    const { runMcpServer } = await import("./mcp/server.js");
    await runMcpServer(parseInt(opts.port));
  });

program.parse();
