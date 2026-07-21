import { Command } from "commander";
import chalk from "chalk";
import { createSpinner, handleCommandError, logInfo, logTitle } from "../core/logger.js";
import { searchRegistry } from "../services/install-service.js";

export function registerSearchCommand(program: Command): void {
  program
    .command("search")
    .description("Search assets in a registry")
    .argument("<query>", "Search query")
    .option("-r, --registry <url>", "Registry repository URL (defaults to last used)")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (query: string, opts: { registry?: string; verbose?: boolean }) => {
      const spinner = createSpinner("Searching registry…");
      try {
        spinner.start();
        const results = await searchRegistry(query, opts.registry, {
          verbose: opts.verbose,
        });
        spinner.stop();

        if (results.length === 0) {
          logInfo(`No assets matched "${query}"`);
          return;
        }

        logTitle(`Search results for "${query}" (${results.length})`);
        for (const result of results) {
          const desc = result.description ? chalk.dim(` — ${result.description}`) : "";
          console.log(
            `  ${chalk.cyan(result.type.padEnd(7))} ${chalk.bold(result.id)}@${result.version}${desc}`,
          );
        }
      } catch (error) {
        spinner.stop();
        handleCommandError(error, opts.verbose);
      }
    });
}
