import chalk from "chalk";
import ora, { type Ora } from "ora";
import { isNoahError } from "./errors.js";

export function createSpinner(text: string): Ora {
  return ora({ text, spinner: "dots" });
}

export function logSuccess(message: string): void {
  console.log(`${chalk.green("✔")} ${message}`);
}

export function logError(message: string): void {
  console.error(`${chalk.red("✖")} ${message}`);
}

export function logWarn(message: string): void {
  console.warn(`${chalk.yellow("⚠")} ${message}`);
}

export function logInfo(message: string): void {
  console.log(`${chalk.cyan("ℹ")} ${message}`);
}

export function logVerbose(message: string, verbose?: boolean): void {
  if (verbose) {
    console.log(chalk.dim(`  ${message}`));
  }
}

export function logTitle(title: string): void {
  console.log();
  console.log(chalk.bold.cyan(title));
  console.log(chalk.dim("─".repeat(Math.min(title.length, 40))));
}

export function formatError(error: unknown): string {
  if (isNoahError(error)) {
    return `${error.message}${error.code ? chalk.dim(` [${error.code}]`) : ""}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function handleCommandError(error: unknown, verbose?: boolean): never {
  logError(formatError(error));
  if (verbose && error instanceof Error && error.stack) {
    console.error(chalk.dim(error.stack));
  }
  process.exit(1);
}
