import { Command } from "commander";
import chalk from "chalk";
import { createSpinner, handleCommandError, logTitle } from "../core/logger.js";
import { IDE_IDS, parseIdeId } from "../constants/index.js";
import { installByPackageNames } from "../services/install-service.js";
import type { AddOptions } from "../types/index.js";

export function registerInstallCommand(program: Command): void {
  program
    .command("install")
    .alias("i")
    .description("Install packages by name (e.g. laravel-api, rule/laravel-api@1.0.0)")
    .argument("[packages...]", "Package names")
    .option("--skill <name>", "Install a skill by id")
    .option("--rule <name>", "Install a rule by id")
    .option("--prompt <name>", "Install a prompt by id")
    .option("--mcp <name>", "Install an MCP config by id")
    .option("--preset <name>", "Install a preset")
    .option("--all", "Install all assets from the registry", false)
    .option("--ide <name>", `Target IDE (${IDE_IDS.join("|")})`, "cursor")
    .option("--target <name>", "Alias for --ide")
    .option("--force", "Overwrite existing assets", false)
    .option("--dry-run", "Show what would be installed without writing files", false)
    .option("-y, --yes", "Skip confirmation prompts", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(
      async (
        packages: string[],
        opts: AddOptions & { dryRun?: boolean; ide?: string; target?: string; all?: boolean },
      ) => {
        const spinner = createSpinner("Installing…");
        try {
          const ide = parseIdeId(opts.target ?? opts.ide);
          const names = [...packages];
          if (opts.skill) names.push(`skill/${opts.skill}`);
          if (opts.rule) names.push(`rule/${opts.rule}`);
          if (opts.prompt) names.push(`prompt/${opts.prompt}`);
          if (opts.mcp) names.push(`mcp/${opts.mcp}`);
          if (opts.preset) names.push(`preset/${opts.preset}`);

          if (opts.all) {
            const { addFromRegistry } = await import("../services/install-service.js");
            spinner.start();
            const results = await addFromRegistry(undefined, {
              all: true,
              force: opts.force,
              dryRun: opts.dryRun,
              yes: opts.yes,
              verbose: opts.verbose,
              ide,
            });
            spinner.stop();
            printResults(results, opts.dryRun);
            return;
          }

          spinner.start();
          const results = await installByPackageNames(names, {
            force: opts.force,
            dryRun: opts.dryRun,
            yes: opts.yes,
            verbose: opts.verbose,
            ide,
          });
          spinner.stop();
          printResults(results, opts.dryRun);
        } catch (error) {
          spinner.stop();
          handleCommandError(error, opts.verbose);
        }
      },
    );
}

function printResults(
  results: Array<{ skipped?: boolean; type: string; id: string; version: string }>,
  dryRun?: boolean,
): void {
  if (results.length === 0) return;
  logTitle("Results");
  for (const result of results) {
    const status = result.skipped
      ? chalk.yellow("skipped")
      : dryRun
        ? chalk.cyan("planned")
        : chalk.green("installed");
    console.log(`  ${status}  ${chalk.bold(result.type)}/${result.id}@${result.version}`);
  }
}
