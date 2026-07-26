import { Command } from "commander";
import { handleCommandError, logInfo } from "../core/logger.js";
import { runUndo } from "../services/extras.js";
import { isPromptExit } from "../ui/prompt-errors.js";

export function registerUndoCommand(program: Command): void {
  program
    .command("undo")
    .description("Rollback the last install or uninstall")
    .option("--dry-run", "Show what would be undone", false)
    .option("-y, --yes", "Skip confirmation", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { dryRun?: boolean; yes?: boolean; verbose?: boolean }) => {
      try {
        await runUndo(opts);
      } catch (error) {
        if (isPromptExit(error)) {
          logInfo("Cancelled.");
          return;
        }
        handleCommandError(error, opts.verbose);
      }
    });
}
