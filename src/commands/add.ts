import { Command } from "commander";
import chalk from "chalk";
import { createSpinner, handleCommandError, logTitle } from "../core/logger.js";
import { IDE_IDS, parseIdeId } from "../constants/index.js";
import { addFromRegistry } from "../services/install-service.js";
import type { AddOptions } from "../types/index.js";

export function registerAddCommand(program: Command): void {
  program
    .command("add")
    .description("Install assets from Noah's registry")
    .option("--skill <name>", "Install a skill by id")
    .option("--rule <name>", "Install a rule by id")
    .option("--prompt <name>", "Install a prompt by id")
    .option("--mcp <name>", "Install an MCP config by id")
    .option("--preset <name>", "Install a preset (expands to included assets)")
    .option("--all", "Install all assets from the registry", false)
    .option(
      "--ide <name>",
      `Target IDE (${IDE_IDS.join("|")})`,
      "cursor",
    )
    .option("--target <name>", "Alias for --ide")
    .option("--force", "Overwrite existing assets", false)
    .option("--dry-run", "Show what would be installed without writing files", false)
    .option("-y, --yes", "Skip confirmation prompts", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: AddOptions & { dryRun?: boolean; ide?: string; target?: string }) => {
      const spinner = createSpinner("Loading registry…");
      try {
        const ide = parseIdeId(opts.target ?? opts.ide);
        spinner.start();
        const options: AddOptions = {
          skill: opts.skill,
          rule: opts.rule,
          prompt: opts.prompt,
          mcp: opts.mcp,
          preset: opts.preset,
          all: opts.all,
          force: opts.force,
          dryRun: opts.dryRun,
          yes: opts.yes,
          verbose: opts.verbose,
          ide,
        };

        spinner.text = "Validating and installing assets…";
        const results = await addFromRegistry(undefined, options);
        spinner.stop();

        if (results.length > 0) {
          logTitle("Results");
          for (const result of results) {
            const status = result.skipped
              ? chalk.yellow("skipped")
              : options.dryRun
                ? chalk.cyan("planned")
                : chalk.green("installed");
            console.log(
              `  ${status}  ${chalk.bold(result.type)}/${result.id}@${result.version}`,
            );
          }
        }
      } catch (error) {
        spinner.stop();
        handleCommandError(error, opts.verbose);
      }
    });
}
