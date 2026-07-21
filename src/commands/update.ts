import { Command } from "commander";
import chalk from "chalk";
import { createSpinner, handleCommandError, logTitle } from "../core/logger.js";
import { updateAssets } from "../services/install-service.js";

export function registerUpdateCommand(program: Command): void {
  program
    .command("update")
    .description("Update installed assets from their registry")
    .option("--dry-run", "Show what would be updated", false)
    .option("-y, --yes", "Skip confirmation prompts", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { dryRun?: boolean; yes?: boolean; verbose?: boolean }) => {
      const spinner = createSpinner("Updating installed assets…");
      try {
        spinner.start();
        const results = await updateAssets({
          dryRun: opts.dryRun,
          yes: opts.yes,
          verbose: opts.verbose,
          force: true,
        });
        spinner.stop();

        if (results.length > 0) {
          logTitle("Updated");
          for (const result of results) {
            console.log(
              `  ${chalk.green("updated")}  ${chalk.bold(result.type)}/${result.id}@${result.version}`,
            );
          }
        }
      } catch (error) {
        spinner.stop();
        handleCommandError(error, opts.verbose);
      }
    });
}
