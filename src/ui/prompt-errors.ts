import { ExitPromptError } from "@inquirer/core";

export function isPromptExit(error: unknown): boolean {
  return error instanceof ExitPromptError || (error instanceof Error && error.name === "ExitPromptError");
}
