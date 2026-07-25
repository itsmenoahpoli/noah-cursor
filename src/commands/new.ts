import { Command } from "commander";
import { handleCommandError } from "../core/logger.js";
import { IDE_IDS, parseIdeId } from "../constants/index.js";
import { createTemplate } from "../services/extras.js";

export function registerNewCommand(program: Command): void {
  program
    .command("new")
    .description("Scaffold AI workflow templates (saas, api, react, marketing)")
    .argument("<template>", "Template name")
    .option("--ide <name>", `Target IDE (${IDE_IDS.join("|")})`, "cursor")
    .option("--target <name>", "Alias for --ide")
    .option("--dry-run", "Show packages without installing", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(
      async (
        template: string,
        opts: { ide?: string; target?: string; dryRun?: boolean; verbose?: boolean },
      ) => {
        try {
          const ide = parseIdeId(opts.target ?? opts.ide);
          await createTemplate(template, {
            ide,
            dryRun: opts.dryRun,
            verbose: opts.verbose,
          });
        } catch (error) {
          handleCommandError(error, opts.verbose);
        }
      },
    );
}
