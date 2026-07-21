export const CLI_NAME = "noah-cursor";
export const CLI_VERSION = "1.0.0";
export const CURSOR_DIR = ".cursor";
export const METADATA_FILE = "noah.json";
export const MANIFEST_FILE = "manifest.json";

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
