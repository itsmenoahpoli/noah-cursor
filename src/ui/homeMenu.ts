import { select } from "@inquirer/prompts";
import chalk from "chalk";
import { isPromptExit } from "./prompt-errors.js";
import { logInfo } from "../core/logger.js";
import { listRegistryAssets } from "../services/install-service.js";
import type { AssetType } from "../types/index.js";
import { CATEGORY_OPTIONS } from "./categoryMenu.js";

export type HomeAction = "bootstrap" | AssetType | "quit";

const BROWSE_FLAGS: Record<AssetType, string> = {
  skill: "--browse-skills",
  rule: "--browse-rules",
  prompt: "--browse-prompts",
  mcp: "--browse-mcp",
  preset: "--browse-presets",
};

async function availableCategories(): Promise<AssetType[]> {
  try {
    const listed = await listRegistryAssets();
    const counts = new Map<AssetType, number>();
    for (const asset of listed.assets) {
      counts.set(asset.type, (counts.get(asset.type) ?? 0) + 1);
    }
    return CATEGORY_OPTIONS.map((c) => c.value).filter((type) => (counts.get(type) ?? 0) > 0);
  } catch {
    // Fall back to all registry categories if the catalog cannot be loaded
    return CATEGORY_OPTIONS.map((c) => c.value);
  }
}

export async function promptHomeMenu(): Promise<HomeAction> {
  const available = await availableCategories();

  console.log(chalk.bold("What would you like to do?"));
  console.log();

  const choices: Array<{ name: string; value: HomeAction }> = [
    {
      name: `Bootstrap project${chalk.dim(" — detect stack, recommend, confirm & install")}`,
      value: "bootstrap",
    },
    ...CATEGORY_OPTIONS.filter((option) => available.includes(option.value)).map((option) => ({
      name: `${option.name}${chalk.dim(` — ${option.hint}`)}`,
      value: option.value as HomeAction,
    })),
    { name: "Quit", value: "quit" },
  ];

  if (available.length === 0) {
    logInfo("No Skills, Rules, Prompts, MCP configs, or Presets in the registry yet.");
  }

  return select<HomeAction>({
    message: "NOAH CLI",
    choices,
  });
}

/** Resolve home menu selection into argv tokens for Commander. */
export async function resolveHomeArgv(): Promise<string[] | null> {
  try {
    const action = await promptHomeMenu();
    if (action === "quit") {
      logInfo("Goodbye.");
      return null;
    }

    if (action === "bootstrap") {
      return ["bootstrap"];
    }

    return ["browse", BROWSE_FLAGS[action]];
  } catch (error) {
    if (isPromptExit(error)) {
      logInfo("Cancelled.");
      return null;
    }
    throw error;
  }
}
