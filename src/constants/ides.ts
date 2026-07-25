export const IDE_IDS = [
  "cursor",
  "windsurf",
  "claude-code",
  "continue",
  "vscode",
  "cline",
  "gemini",
  "codex",
  "roo",
  "aider",
] as const;

export type IdeId = (typeof IDE_IDS)[number];

export const DEFAULT_IDE: IdeId = "cursor";

export interface IdeDefinition {
  id: IdeId;
  name: string;
  /** Project-root directory where assets are installed */
  rootDir: string;
  hint: string;
}

/** Supported IDE / AI assistant install targets. */
export const IDE_DEFINITIONS: readonly IdeDefinition[] = [
  {
    id: "cursor",
    name: "Cursor",
    rootDir: ".cursor",
    hint: "Skills, Rules, and MCP under .cursor/",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    rootDir: ".windsurf",
    hint: "Cascade rules and workflows under .windsurf/",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    rootDir: ".claude",
    hint: "Claude Code skills and settings under .claude/",
  },
  {
    id: "continue",
    name: "Continue",
    rootDir: ".continue",
    hint: "Continue prompts and rules under .continue/",
  },
  {
    id: "vscode",
    name: "VS Code",
    rootDir: ".vscode",
    hint: "Workspace AI assets under .vscode/",
  },
  {
    id: "cline",
    name: "Cline",
    rootDir: ".cline",
    hint: "Cline rules and prompts under .cline/",
  },
  {
    id: "gemini",
    name: "Gemini CLI",
    rootDir: ".gemini",
    hint: "Gemini CLI assets under .gemini/",
  },
  {
    id: "codex",
    name: "Codex CLI",
    rootDir: ".codex",
    hint: "Codex CLI assets under .codex/",
  },
  {
    id: "roo",
    name: "Roo Code",
    rootDir: ".roo",
    hint: "Roo Code assets under .roo/",
  },
  {
    id: "aider",
    name: "Aider",
    rootDir: ".aider",
    hint: "Aider conventions under .aider/",
  },
] as const;

export function isIdeId(value: string): value is IdeId {
  return (IDE_IDS as readonly string[]).includes(value);
}

export function getIdeDefinition(id: IdeId): IdeDefinition {
  const found = IDE_DEFINITIONS.find((ide) => ide.id === id);
  if (!found) {
    throw new Error(`Unknown IDE: ${id}`);
  }
  return found;
}

export function parseIdeId(value: string | undefined, fallback: IdeId = DEFAULT_IDE): IdeId {
  if (!value) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  // Aliases from roadmap --target names
  const aliases: Record<string, IdeId> = {
    claude: "claude-code",
    "claude-code": "claude-code",
    gemini: "gemini",
    codex: "codex",
    continue: "continue",
    windsurf: "windsurf",
    cline: "cline",
    roo: "roo",
    "roo-code": "roo",
    aider: "aider",
    cursor: "cursor",
    vscode: "vscode",
  };
  const mapped = aliases[normalized] ?? normalized;
  if (!isIdeId(mapped)) {
    throw new Error(`Unknown IDE "${value}". Supported: ${IDE_IDS.join(", ")}`);
  }
  return mapped;
}
