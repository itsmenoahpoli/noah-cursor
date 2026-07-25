import { Command } from "commander";
import chalk from "chalk";
import { select } from "@inquirer/prompts";
import { createSpinner, handleCommandError, logInfo, logTitle } from "../core/logger.js";
import { ASSET_TYPES } from "../constants/index.js";
import { searchRegistry } from "../services/install-service.js";
import type { AssetType } from "../types/index.js";
import { isPromptExit } from "../ui/prompt-errors.js";

export function registerSearchCommand(program: Command): void {
  program
    .command("search")
    .description("Fuzzy search assets in Noah's registry")
    .argument("<query>", "Search query")
    .option("--tag <tag>", "Filter by tag")
    .option("--type <type>", `Filter by type (${ASSET_TYPES.join("|")})`)
    .option("--interactive", "Pick a result with keyboard navigation", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(
      async (
        query: string,
        opts: {
          verbose?: boolean;
          tag?: string;
          type?: string;
          interactive?: boolean;
        },
      ) => {
        const spinner = createSpinner("Searching registry…");
        try {
          spinner.start();
          const results = await searchRegistry(query, undefined, {
            verbose: opts.verbose,
            tag: opts.tag,
            type: opts.type as AssetType | undefined,
          });
          spinner.stop();

          if (results.length === 0) {
            logInfo(`No assets matched "${query}"`);
            return;
          }

          logTitle(`Search results for "${query}" (${results.length})`);
          for (const result of results) {
            const desc = result.description ? chalk.dim(` — ${result.description}`) : "";
            const meta = [
              result.verified ? chalk.green("✓") : "",
              result.rating != null ? chalk.yellow(`★${result.rating}`) : "",
              result.tags?.length ? chalk.dim(`[${result.tags.join(", ")}]`) : "",
            ]
              .filter(Boolean)
              .join(" ");
            console.log(
              `  ${chalk.cyan(result.type.padEnd(7))} ${chalk.bold(result.id)}@${result.version}${desc} ${meta}`,
            );
          }

          if (opts.interactive && process.stdout.isTTY) {
            const choice = await select({
              message: "Preview which package?",
              choices: [
                ...results.map((r) => ({
                  name: `${r.type}/${r.id}`,
                  value: `${r.type}/${r.id}`,
                })),
                { name: "Cancel", value: "" },
              ],
            });
            if (choice) {
              const { getPackagePreview } = await import("../services/install-service.js");
              const { renderPackagePreview } = await import("../ui/preview.js");
              const preview = await getPackagePreview(choice, { verbose: opts.verbose });
              renderPackagePreview(preview);
            }
          }
        } catch (error) {
          spinner.stop();
          if (isPromptExit(error)) {
            logInfo("Cancelled.");
            return;
          }
          handleCommandError(error, opts.verbose);
        }
      },
    );
}
