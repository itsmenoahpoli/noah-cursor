import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import type { AssetType } from "../types/index.js";
import { printHint } from "./format.js";
import { isPromptExit } from "./prompt-errors.js";

export type BrowseCategory = AssetType;

export const CATEGORY_OPTIONS: Array<{
  value: BrowseCategory;
  name: string;
  hint: string;
}> = [
  { value: "skill", name: "Skills", hint: "Reusable agent skills" },
  { value: "rule", name: "Rules", hint: "Project coding rules" },
  { value: "prompt", name: "Prompts", hint: "Prompt templates" },
  { value: "mcp", name: "MCP", hint: "MCP server configs" },
  { value: "preset", name: "Presets", hint: "Bundled asset packs" },
];

export async function selectCategories(
  preselected?: BrowseCategory[],
): Promise<BrowseCategory[] | null> {
  if (preselected && preselected.length > 0) {
    return preselected;
  }

  console.log(chalk.bold("Select categories to browse"));
  console.log();
  printHint([
    "↑ ↓ Navigate",
    "Space Select",
    "A Toggle all · I Invert",
    "Enter Continue · Esc Cancel",
  ]);
  console.log();

  try {
    return await checkbox({
      message: "Categories",
      pageSize: 10,
      required: true,
      choices: CATEGORY_OPTIONS.map((option) => ({
        name: `${option.name}${chalk.dim(` — ${option.hint}`)}`,
        value: option.value,
        short: option.name,
      })),
    });
  } catch (error) {
    if (isPromptExit(error)) {
      return null;
    }
    throw error;
  }
}
