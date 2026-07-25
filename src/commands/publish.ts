import { Command } from "commander";
import { handleCommandError, logInfo } from "../core/logger.js";
import { runPublishWizard } from "../services/ecosystem.js";
import { isPromptExit } from "../ui/prompt-errors.js";

export function registerPublishCommand(program: Command): void {
  program
    .command("publish")
    .description("Interactive wizard to scaffold and register a new package")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { verbose?: boolean }) => {
      try {
        await runPublishWizard(process.cwd());
      } catch (error) {
        if (isPromptExit(error)) {
          logInfo("Cancelled.");
          return;
        }
        handleCommandError(error, opts.verbose);
      }
    });
}
