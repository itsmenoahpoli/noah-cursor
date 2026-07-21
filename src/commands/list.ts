import { Command } from "commander";
import chalk from "chalk";
import { handleCommandError, logInfo, logTitle } from "../core/logger.js";
import { readMetadata } from "../metadata/store.js";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List installed Noah Cursor assets")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { verbose?: boolean }) => {
      try {
        const metadata = await readMetadata();
        if (!metadata || metadata.installed.length === 0) {
          logInfo("No assets installed. Use `noah-cursor add` to install some.");
          return;
        }

        logTitle(`Installed assets (${metadata.installed.length})`);
        console.log(chalk.dim(`  Registry: ${metadata.registry}`));
        if (metadata.updatedAt) {
          console.log(chalk.dim(`  Updated:  ${metadata.updatedAt}`));
        }
        console.log();

        for (const asset of metadata.installed) {
          const pathInfo = asset.path ? chalk.dim(` → ${asset.path}`) : "";
          console.log(
            `  ${chalk.cyan(asset.type.padEnd(7))} ${chalk.bold(asset.id)}@${asset.version}${pathInfo}`,
          );
        }
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });
}
