import { Command } from "commander";
import chalk from "chalk";
import { handleCommandError, logTitle } from "../core/logger.js";
import { IDE_IDS, parseIdeId } from "../constants/index.js";
import { previewDiff } from "../services/extras.js";

export function registerConfigCommands(program: Command): void {
  program
    .command("diff")
    .description("Preview file changes before installing a package")
    .argument("<package>", "Package name")
    .option("--ide <name>", `Target IDE (${IDE_IDS.join("|")})`, "cursor")
    .option("--target <name>", "Alias for --ide")
    .option("-v, --verbose", "Verbose output", false)
    .action(
      async (
        pkg: string,
        opts: { ide?: string; target?: string; verbose?: boolean },
      ) => {
        try {
          const ide = parseIdeId(opts.target ?? opts.ide);
          await previewDiff(pkg, { ide, verbose: opts.verbose });
        } catch (error) {
          handleCommandError(error, opts.verbose);
        }
      },
    );

  program
    .command("trending")
    .description("Show trending packages")
    .option("--period <name>", "today|week|month", "week")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { period?: string; verbose?: boolean }) => {
      try {
        const { listTrending } = await import("../services/ecosystem.js");
        const period = (opts.period as "today" | "week" | "month") ?? "week";
        const items = await listTrending(period, { verbose: opts.verbose });
        logTitle(`Trending · ${period}`);
        for (const item of items) {
          const stars = item.rating != null ? `★${item.rating}` : "";
          console.log(
            `  ${chalk.cyan(item.type.padEnd(7))} ${chalk.bold(item.id)}  ↓${item.downloads ?? 0}  ${stars}`,
          );
        }
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });
}
