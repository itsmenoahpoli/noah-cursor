import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json") as { version: string };

export const CLI_NAME = "noah-cursor";
export const CLI_VERSION = pkg.version;
/** @deprecated Prefer IDE root via getIdeDefinition — kept for Cursor default. */
export const CURSOR_DIR = ".cursor";
export const METADATA_FILE = "noah.json";
export const MANIFEST_FILE = "manifest.json";
/** Project-root team workspace config (distinct from per-IDE install ledger). */
export const WORKSPACE_FILE = "noah.config.json";
export const LOCKFILE_NAME = "noah.lock";
export const USER_DIR_NAME = ".noah";

export {
  DEFAULT_IDE,
  IDE_DEFINITIONS,
  IDE_IDS,
  getIdeDefinition,
  isIdeId,
  parseIdeId,
  type IdeDefinition,
  type IdeId,
} from "./ides.js";

/** Official Noah asset registry (Skills, Rules, Prompts, MCP, Presets). */
export const OFFICIAL_REGISTRY_OWNER = "itsmenoahpoli";
export const OFFICIAL_REGISTRY_REPO = "noah-cursor";
export const OFFICIAL_REGISTRY = `https://github.com/${OFFICIAL_REGISTRY_OWNER}/${OFFICIAL_REGISTRY_REPO}`;

/** User-facing registry name — never expose local paths or internals. */
export const PUBLIC_REGISTRY_LABEL = "Noah registry";

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
