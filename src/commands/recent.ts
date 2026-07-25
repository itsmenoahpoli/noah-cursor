import { Command } from "commander";
import chalk from "chalk";
import { handleCommandError, logInfo, logTitle } from "../core/logger.js";
import { listRecent } from "../metadata/user-store.js";

export function registerRecentCommand(program: Command): void {
  program
    .command("recent")
    .description("Show recently installed, viewed, or updated packages")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { verbose?: boolean }) => {
      try {
        const recent = await listRecent();
        if (recent.length === 0) {
          logInfo("No recent packages yet.");
          return;
        }
        logTitle(`Recent (${recent.length})`);
        for (const entry of recent) {
          const when = new Date(entry.at).toLocaleString();
          console.log(
            `  ${chalk.cyan(entry.action.padEnd(10))} ${chalk.bold(`${entry.type}/${entry.id}`)} ${chalk.dim(when)}`,
          );
        }
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });
}
