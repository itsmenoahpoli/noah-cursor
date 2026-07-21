import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json") as { version: string };

export const CLI_NAME = "noah-cursor";
export const CLI_VERSION = pkg.version;
export const CURSOR_DIR = ".cursor";
export const METADATA_FILE = "noah.json";
export const MANIFEST_FILE = "manifest.json";

/** Official Noah asset registry (Skills, Rules, Prompts, MCP, Presets). */
export const OFFICIAL_REGISTRY_OWNER = "itsmenoahpoli";
export const OFFICIAL_REGISTRY_REPO = "noah-cursor";
export const OFFICIAL_REGISTRY = `https://github.com/${OFFICIAL_REGISTRY_OWNER}/${OFFICIAL_REGISTRY_REPO}`;

/** Sentinel source: load the registry bundled into this package at build time. */
export const BUNDLED_REGISTRY = "bundled:noah-cursor";

export const ASSET_TYPES = ["skill", "rule", "prompt", "mcp", "preset"] as const;

export const ASSET_DIRECTORIES = {
  skill: "skills",
  rule: "rules",
  prompt: "prompts",
  mcp: "mcp",
  preset: "presets",
} as const;

export const REGISTRY_REQUIRED_DIRS = ["skills", "rules", "prompts", "mcp", "presets"] as const;

export const TEMP_DIR_PREFIX = "noah-cursor-";
