#!/usr/bin/env node
/**
 * Copy the Noah registry (manifest + asset dirs) into dist/registry
 * so the published CLI can install without cloning GitHub.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest = path.join(root, "dist", "noah-registry");

const entries = [
  "manifest.json",
  "skills",
  "rules",
  "prompts",
  "mcp",
  "presets",
];

await fs.remove(dest);
await fs.ensureDir(dest);

for (const entry of entries) {
  const source = path.join(root, entry);
  if (!(await fs.pathExists(source))) {
    console.error(`bundle-registry: missing ${entry}`);
    process.exit(1);
  }
  await fs.copy(source, path.join(dest, entry));
}

console.log(`Bundled registry → ${path.relative(root, dest)}`);
