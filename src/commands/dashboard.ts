import { Command } from "commander";
import { handleCommandError } from "../core/logger.js";
import { IDE_IDS, parseIdeId } from "../constants/index.js";
import { showDashboard } from "../services/extras.js";

export function registerDashboardCommand(program: Command): void {
  program
    .command("dashboard")
    .description("Interactive summary of updates, health, and recommendations")
    .option("--ide <name>", `Target IDE (${IDE_IDS.join("|")})`, "cursor")
    .option("--target <name>", "Alias for --ide")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { ide?: string; target?: string; verbose?: boolean }) => {
      try {
        const ide = parseIdeId(opts.target ?? opts.ide);
        await showDashboard(ide);
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });
}
