import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import type { AssetEntry, AssetType, PresetEntry } from "../types/index.js";
import { formatAssetLabel, printHint } from "./format.js";
import { isPromptExit } from "./prompt-errors.js";

const TITLES: Record<AssetType, string> = {
  skill: "Available Skills",
  rule: "Available Rules",
  prompt: "Available Prompts",
  mcp: "Available MCP Configurations",
  preset: "Available Presets",
};

export async function selectAssets(
  type: AssetType,
  assets: Array<AssetEntry | PresetEntry>,
): Promise<string[] | null> {
  if (assets.length === 0) {
    console.log(chalk.yellow(`No ${type}s found in this registry.`));
    console.log();
    return [];
  }

  console.log(chalk.bold(TITLES[type]));
  console.log();
  printHint([
    "↑ ↓ Navigate",
    "Space Select",
    "A Toggle all · I Invert",
    "Enter Confirm · Esc Skip",
  ]);
  console.log();

  try {
    return await checkbox({
      message: TITLES[type],
      pageSize: Math.min(12, Math.max(assets.length, 5)),
      choices: assets.map((asset) => ({
        name: formatAssetLabel(asset.id, asset.description),
        value: asset.id,
        short: asset.id,
      })),
    });
  } catch (error) {
    if (isPromptExit(error)) {
      return null;
    }
    throw error;
  }
}

export async function selectSkills(assets: AssetEntry[]): Promise<string[] | null> {
  return selectAssets("skill", assets);
}

export async function selectRules(assets: AssetEntry[]): Promise<string[] | null> {
  return selectAssets("rule", assets);
}

export async function selectPrompts(assets: AssetEntry[]): Promise<string[] | null> {
  return selectAssets("prompt", assets);
}

export async function selectMcp(assets: AssetEntry[]): Promise<string[] | null> {
  return selectAssets("mcp", assets);
}

export async function selectPresets(assets: PresetEntry[]): Promise<string[] | null> {
  return selectAssets("preset", assets);
}
