#!/usr/bin/env node

import { Command } from "commander";
import open from "open";
import path from "path";
import { fileURLToPath } from "url";
import express, { type Request, type Response, type NextFunction } from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const program = new Command();

program
  .name("stacklane")
  .description("Browser-based OS-like UI for managing remote servers via SSH")
  .version("0.1.1")
  .option("-p, --port <number>", "Port to run on", "3721")
  .option("--no-open", "Don't open browser automatically")
  .action(async (opts) => {
    const port = parseInt(opts.port);

    const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
    const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
    const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
    const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

    console.log(`\n  ${dim("Starting")} ${bold(cyan("StackLane"))}${dim("...")}\n`);

    // Dynamic import from bundled server directory (inside dist/)
    const serverModule = "./server/main.js";
    const { createApp } = await import(/* webpackIgnore: true */ serverModule);
    const { app, server, init } = await createApp(port);

    // Static files must be registered BEFORE NestJS init,
    // otherwise NestJS's 404 handler intercepts them
    const webDist = path.resolve(__dirname, "web");
    app.use(express.static(webDist));

    // SPA catch-all: serve index.html for client-side routes,
    // but let /api requests fall through to NestJS
    app.get("{*path}", (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(webDist, "index.html"));
    });

    await init();

    server.listen(port, () => {
      const url = `http://localhost:${port}`;
      console.log(`  ${green("Ready!")} ${bold("StackLane")} is running at ${cyan(url)}`);
      console.log(`\n  ${dim("Press")} ${dim(bold("Ctrl+C"))} ${dim("to stop")}\n`);

      if (opts.open !== false) {
        open(url);
      }
    });
  });

program.parse();
