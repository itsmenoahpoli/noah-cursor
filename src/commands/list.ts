import { Command } from "commander";
import chalk from "chalk";
import { createSpinner, handleCommandError, logInfo, logTitle } from "../core/logger.js";
import { listInstalledAssets } from "../metadata/store.js";
import { listRegistryAssets } from "../services/install-service.js";
import type { AssetType } from "../types/index.js";

const TYPE_ORDER: AssetType[] = ["skill", "rule", "prompt", "mcp", "preset"];

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List all Skills, Rules, Prompts, MCP configs, and Presets in Noah's registry")
    .option("--installed", "List locally installed assets only", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { installed?: boolean; verbose?: boolean }) => {
      if (opts.installed) {
        try {
          const listed = await listInstalledAssets();
          if (listed.installed.length === 0) {
            logInfo("No assets installed. Use `noah-cursor add` to install some.");
            return;
          }

          logTitle(`Installed assets (${listed.installed.length})`);
          if (listed.registry) {
            console.log(chalk.dim(`  Registry: ${listed.registry}`));
          }
          if (listed.updatedAt) {
            console.log(chalk.dim(`  Updated:  ${listed.updatedAt}`));
          }
          console.log();

          for (const asset of listed.installed) {
            const pathInfo = asset.path ? chalk.dim(` → ${asset.path}`) : "";
            console.log(
              `  ${chalk.cyan(asset.type.padEnd(7))} ${chalk.bold(asset.id)}@${asset.version}${pathInfo}`,
            );
          }
        } catch (error) {
          handleCommandError(error, opts.verbose);
        }
        return;
      }

      const spinner = createSpinner("Loading registry…");
      try {
        spinner.start();
        const listed = await listRegistryAssets(undefined, { verbose: opts.verbose });
        spinner.stop();

        if (listed.assets.length === 0) {
          logInfo("No assets found in the registry manifest.");
          return;
        }

        logTitle(`Registry assets (${listed.assets.length})`);
        console.log(chalk.dim(`  ${listed.name}@${listed.version}`));
        console.log(chalk.dim(`  ${listed.registry}`));
        console.log();

        for (const type of TYPE_ORDER) {
          const group = listed.assets.filter((asset) => asset.type === type);
          if (group.length === 0) {
            continue;
          }

          console.log(chalk.bold(type === "mcp" ? "MCP" : `${type[0]!.toUpperCase()}${type.slice(1)}s`));
          for (const asset of group) {
            const desc = asset.description ? chalk.dim(` — ${asset.description}`) : "";
            console.log(
              `  ${chalk.cyan(asset.type.padEnd(7))} ${chalk.bold(asset.id)}@${asset.version}${desc}`,
            );
          }
          console.log();
        }
      } catch (error) {
        spinner.stop();
        handleCommandError(error, opts.verbose);
      }
    });
}
