import boxen from "boxen";
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import { DEFAULT_IDE, getIdeDefinition, type IdeId } from "../constants/index.js";
import type { AssetRequest, AssetType } from "../types/index.js";
import { humanizeId } from "./format.js";
import { toPublicRegistryLabel } from "../utils/registry.js";
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

export function renderSummary(
  _registryUrl: string,
  selections: AssetRequest[],
  ide: IdeId = DEFAULT_IDE,
): void {
  const groups = groupSelections(selections);
  const ideDef = getIdeDefinition(ide);
  const lines: string[] = [];

  lines.push(chalk.bold("Installation Summary"));
  lines.push("");
  lines.push(chalk.dim("Registry"));
  lines.push(`  ${toPublicRegistryLabel()}`);
  lines.push("");
  lines.push(chalk.dim("IDE"));
  lines.push(`  ${chalk.cyan(ideDef.name)} ${chalk.dim(`(${ideDef.rootDir}/)`)}`);
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
  lines.push(`  ${chalk.cyan(`./${ideDef.rootDir}`)}`);

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
  ide: IdeId = DEFAULT_IDE,
): Promise<boolean> {
  if (selections.length === 0) {
    return false;
  }

  renderSummary(registryUrl, selections, ide);

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
