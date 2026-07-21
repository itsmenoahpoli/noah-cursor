import boxen from "boxen";
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import type { AssetRequest, AssetType } from "../types/index.js";
import { humanizeId } from "./format.js";
import { displayRegistryUrl } from "../utils/fs.js";
import { isPromptExit } from "./prompt-errors.js";

const SECTION_LABELS: Record<AssetType, string> = {
  skill: "Skills",
  rule: "Rules",
  prompt: "Prompts",
  mcp: "MCP",
  preset: "Presets",
};

function groupSelections(selections: AssetRequest[]): Partial<Record<AssetType, string[]>> {
  const groups: Partial<Record<AssetType, string[]>> = {};
  for (const item of selections) {
    const list = groups[item.type] ?? [];
    list.push(item.id);
    groups[item.type] = list;
  }
  return groups;
}

export function renderSummary(registryUrl: string, selections: AssetRequest[]): void {
  const groups = groupSelections(selections);
  const lines: string[] = [];

  lines.push(chalk.bold("Installation Summary"));
  lines.push("");
  lines.push(chalk.dim("Registry"));
  lines.push(`  ${displayRegistryUrl(registryUrl)}`);
  lines.push("");

  for (const type of ["skill", "rule", "prompt", "mcp", "preset"] as const) {
    const ids = groups[type];
    if (!ids || ids.length === 0) continue;
    lines.push(chalk.dim(SECTION_LABELS[type]));
    for (const id of ids) {
      lines.push(`  ${chalk.green("✓")} ${humanizeId(id)}`);
    }
    lines.push("");
  }

  lines.push(chalk.dim("Destination"));
  lines.push(`  ${chalk.cyan("./.cursor")}`);

  console.log(
    boxen(lines.join("\n"), {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: "round",
      borderColor: "cyan",
    }),
  );
}

export async function confirmInstallation(
  registryUrl: string,
  selections: AssetRequest[],
): Promise<boolean> {
  if (selections.length === 0) {
    return false;
  }

  renderSummary(registryUrl, selections);

  try {
    return await confirm({
      message: "Continue?",
      default: true,
    });
  } catch (error) {
    if (isPromptExit(error)) {
      return false;
    }
    throw error;
  }
}
