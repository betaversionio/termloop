#!/usr/bin/env node
// Validates packages/web/public/registry/catalog.json (apps) and
// widgets-catalog.json (widgets) against their TypeScript shapes
// (MarketplaceApp / MarketplaceWidget in packages/shared/src/types).
// Neither catalog is validated anywhere else, so a malformed PR entry
// currently fails silently at runtime instead of at CI/review time.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_DIR = path.join(__dirname, "..", "packages", "web", "public", "registry");

const CATEGORIES = new Set(["tools", "media", "development", "utilities", "other"]);
const SIZES = new Set(["small", "medium", "large"]);

let errors = [];

function fail(entryLabel, message) {
  errors.push(`${entryLabel}: ${message}`);
}

function checkString(entryLabel, obj, field, { required = true } = {}) {
  const v = obj[field];
  if (v === undefined) {
    if (required) fail(entryLabel, `missing required field "${field}"`);
    return;
  }
  if (typeof v !== "string") fail(entryLabel, `"${field}" must be a string, got ${typeof v}`);
}

function checkStringArray(entryLabel, obj, field, { required = false } = {}) {
  const v = obj[field];
  if (v === undefined) {
    if (required) fail(entryLabel, `missing required field "${field}"`);
    return;
  }
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) {
    fail(entryLabel, `"${field}" must be an array of strings`);
  }
}

function checkSize(entryLabel, obj, field, { required = true } = {}) {
  const v = obj[field];
  if (v === undefined) {
    if (required) fail(entryLabel, `missing required field "${field}"`);
    return;
  }
  if (typeof v !== "object" || v === null || typeof v.width !== "number" || typeof v.height !== "number") {
    fail(entryLabel, `"${field}" must be { width: number, height: number }`);
  }
}

function checkCategory(entryLabel, obj) {
  if (!CATEGORIES.has(obj.category)) {
    fail(entryLabel, `"category" must be one of ${[...CATEGORIES].join(", ")}, got ${JSON.stringify(obj.category)}`);
  }
}

function validateApp(app, index) {
  const label = `catalog.json[${index}] (${app.id ?? "?"})`;
  checkString(label, app, "id");
  checkString(label, app, "name");
  checkString(label, app, "description");
  checkString(label, app, "author");
  checkString(label, app, "version");
  checkString(label, app, "iconUrl");
  checkString(label, app, "bundleUrl");
  checkStringArray(label, app, "fileAssociations", { required: true });
  checkSize(label, app, "defaultSize");
  if (typeof app.minWidth !== "number") fail(label, `"minWidth" must be a number`);
  if (typeof app.minHeight !== "number") fail(label, `"minHeight" must be a number`);
  if (typeof app.showOnDesktop !== "boolean") fail(label, `"showOnDesktop" must be a boolean`);
  if (typeof app.showInDock !== "boolean") fail(label, `"showInDock" must be a boolean`);
  checkCategory(label, app);
  checkStringArray(label, app, "tags");
  checkStringArray(label, app, "incompatiblePlatforms");
}

function validateWidget(widget, index) {
  const label = `widgets-catalog.json[${index}] (${widget.id ?? "?"})`;
  checkString(label, widget, "id");
  checkString(label, widget, "name");
  checkString(label, widget, "description");
  checkString(label, widget, "author");
  checkString(label, widget, "version");
  checkString(label, widget, "iconUrl");
  checkString(label, widget, "bundleUrl");
  checkCategory(label, widget);
  checkStringArray(label, widget, "tags");
  checkStringArray(label, widget, "incompatiblePlatforms");
  checkString(label, widget, "requiresApp", { required: false });

  if (typeof widget.sizes !== "object" || widget.sizes === null) {
    fail(label, `"sizes" must be an object`);
  } else {
    const keys = Object.keys(widget.sizes);
    if (keys.length === 0) fail(label, `"sizes" must declare at least one of small/medium/large`);
    for (const key of keys) {
      if (!SIZES.has(key)) fail(label, `"sizes" has unknown size key ${JSON.stringify(key)}`);
      checkSize(label, widget.sizes, key);
    }
  }
}

function loadJson(fileName) {
  const filePath = path.join(REGISTRY_DIR, fileName);
  let raw;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    fail(fileName, `file not found at ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    fail(fileName, `invalid JSON — ${err.message}`);
    return null;
  }
}

function checkDuplicateIds(fileName, entries) {
  const seen = new Set();
  for (const entry of entries) {
    if (entry.id && seen.has(entry.id)) fail(fileName, `duplicate id "${entry.id}"`);
    seen.add(entry.id);
  }
}

const catalog = loadJson("catalog.json");
if (Array.isArray(catalog)) {
  catalog.forEach(validateApp);
  checkDuplicateIds("catalog.json", catalog);
} else if (catalog !== null) {
  fail("catalog.json", "must be a JSON array");
}

const widgetsCatalog = loadJson("widgets-catalog.json");
if (Array.isArray(widgetsCatalog)) {
  widgetsCatalog.forEach(validateWidget);
  checkDuplicateIds("widgets-catalog.json", widgetsCatalog);

  // requiresApp must point at a real, existing app id
  const appIds = new Set((catalog ?? []).map((a) => a.id));
  widgetsCatalog.forEach((w, i) => {
    if (w.requiresApp && !appIds.has(w.requiresApp)) {
      fail(`widgets-catalog.json[${i}] (${w.id ?? "?"})`, `requiresApp "${w.requiresApp}" doesn't match any app id in catalog.json`);
    }
  });
} else if (widgetsCatalog !== null) {
  fail("widgets-catalog.json", "must be a JSON array");
}

if (errors.length > 0) {
  console.error(`✖ ${errors.length} catalog validation error(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`✓ catalog.json (${catalog?.length ?? 0} apps) and widgets-catalog.json (${widgetsCatalog?.length ?? 0} widgets) are valid`);
