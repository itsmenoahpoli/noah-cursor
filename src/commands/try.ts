import { Command } from "commander";
import { handleCommandError } from "../core/logger.js";
import { IDE_IDS, parseIdeId } from "../constants/index.js";
import { tryPackage } from "../services/extras.js";

export function registerTryCommand(program: Command): void {
  program
    .command("try")
    .description("Temporarily install a package in a sandbox directory")
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
          await tryPackage(pkg, { ide, verbose: opts.verbose });
        } catch (error) {
          handleCommandError(error, opts.verbose);
        }
      },
    );
}
