import { Command } from "commander";
import { handleCommandError, logSuccess } from "../core/logger.js";
import { IDE_IDS, parseIdeId } from "../constants/index.js";
import { runSetupWizard, runUpgradeAssistant } from "../services/intelligence.js";
import { isPromptExit } from "../ui/prompt-errors.js";
import { logInfo } from "../core/logger.js";

export function registerWizardCommands(program: Command): void {
  program
    .command("wizard")
    .description("Interactive setup wizard — what are you building?")
    .option("--ide <name>", `Target IDE (${IDE_IDS.join("|")})`, "cursor")
    .option("--target <name>", "Alias for --ide")
    .option("--dry-run", "Plan without installing", false)
    .option("-y, --yes", "Accept recommendations", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(
      async (opts: {
        ide?: string;
        target?: string;
        dryRun?: boolean;
        yes?: boolean;
        verbose?: boolean;
      }) => {
        try {
          const ide = parseIdeId(opts.target ?? opts.ide);
          const results = await runSetupWizard({
            ide,
            dryRun: opts.dryRun,
            yes: opts.yes,
            verbose: opts.verbose,
          });
          logSuccess(`Wizard finished (${results.filter((r) => !r.skipped).length} installed)`);
        } catch (error) {
          if (isPromptExit(error)) {
            logInfo("Cancelled.");
            return;
          }
          handleCommandError(error, opts.verbose);
        }
      },
    );

  program
    .command("upgrade")
    .description("Upgrade assistant — refresh outdated packages for the detected stack")
    .option("--ide <name>", `Target IDE (${IDE_IDS.join("|")})`, "cursor")
    .option("--target <name>", "Alias for --ide")
    .option("--dry-run", "Plan without writing", false)
    .option("-y, --yes", "Accept upgrades", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(
      async (opts: {
        ide?: string;
        target?: string;
        dryRun?: boolean;
        yes?: boolean;
        verbose?: boolean;
      }) => {
        try {
          const ide = parseIdeId(opts.target ?? opts.ide);
          await runUpgradeAssistant({
            ide,
            dryRun: opts.dryRun,
            yes: opts.yes,
            verbose: opts.verbose,
          });
        } catch (error) {
          if (isPromptExit(error)) {
            logInfo("Cancelled.");
            return;
          }
          handleCommandError(error, opts.verbose);
        }
      },
    );
}
