import { select } from "@inquirer/prompts";
import chalk from "chalk";
import {
  DEFAULT_IDE,
  IDE_DEFINITIONS,
  parseIdeId,
  type IdeId,
} from "../constants/index.js";
import { printHint } from "./format.js";
import { isPromptExit } from "./prompt-errors.js";

/**
 * Prompt for target IDE. Pass `preselected` (e.g. from `--ide`) to skip the menu.
 * Defaults to Cursor when the user accepts the default selection.
 */
export async function selectIde(preselected?: string): Promise<IdeId | null> {
  if (preselected) {
    return parseIdeId(preselected);
  }

  console.log(chalk.bold("Select target IDE"));
  console.log();
  printHint(["↑ ↓ Navigate", "Enter Confirm · Esc Cancel"]);
  console.log();

  try {
    return await select({
      message: "IDE",
      default: DEFAULT_IDE,
      choices: IDE_DEFINITIONS.map((ide) => ({
        name: `${ide.name}${chalk.dim(` — ${ide.hint}`)}`,
        value: ide.id,
        short: ide.name,
      })),
    });
  } catch (error) {
    if (isPromptExit(error)) {
      return null;
    }
    throw error;
  }
}
