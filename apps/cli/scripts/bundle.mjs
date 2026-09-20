/**
 * Bundle script: copies compiled server and built web assets into the CLI's dist/
 * so it can be published as a single npm package.
 *
 * Usage: node scripts/bundle.mjs
 * Run after `turbo build` has compiled all packages.
 */

import { cpSync, rmSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(__dirname, "..");
const serverDist = resolve(cliRoot, "../../packages/server/dist");
const webDist = resolve(cliRoot, "../../packages/web/dist");
const cliDist = resolve(cliRoot, "dist/index.js");
const targetServer = resolve(cliRoot, "dist/server");
const targetWeb = resolve(cliRoot, "dist/web");

// Verify source directories exist
if (!existsSync(cliDist)) {
  console.error(`CLI dist not found at ${cliDist}`);
  console.error("Run 'turbo build' first to build the CLI itself (via tsdown).");
  process.exit(1);
}
if (!existsSync(serverDist)) {
  console.error(`Server dist not found at ${serverDist}`);
  console.error("Run 'turbo build' first to compile all packages.");
  process.exit(1);
}
if (!existsSync(webDist)) {
  console.error(`Web dist not found at ${webDist}`);
  console.error("Run 'turbo build' first to compile all packages.");
  process.exit(1);
}

// Clean previous bundled assets (but keep the CLI's own tsdown output)
console.log("Cleaning previous bundles...");
rmSync(targetServer, { recursive: true, force: true });
rmSync(targetWeb, { recursive: true, force: true });

// Copy server dist
console.log(`Copying server -> dist/server`);
cpSync(serverDist, targetServer, { recursive: true });

// Copy web dist
console.log(`Copying web -> dist/web`);
cpSync(webDist, targetWeb, { recursive: true });

console.log("Bundle complete! CLI package is ready for publishing.");
