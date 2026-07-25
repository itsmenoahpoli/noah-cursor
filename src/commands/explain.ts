import { Command } from "commander";
import { createSpinner, handleCommandError } from "../core/logger.js";
import { explainPackage, formatExplanation } from "../services/intelligence.js";

export function registerExplainCommand(program: Command): void {
  program
    .command("explain")
    .description("Explain a package's purpose, benefits, and use cases")
    .argument("<package>", "Package name")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (pkg: string, opts: { verbose?: boolean }) => {
      const spinner = createSpinner("Loading…");
      try {
        spinner.start();
        const preview = await explainPackage(pkg, { verbose: opts.verbose });
        spinner.stop();
        console.log();
        for (const line of formatExplanation(preview)) {
          console.log(line ? `  ${line}` : "");
        }
        console.log();
      } catch (error) {
        spinner.stop();
        handleCommandError(error, opts.verbose);
      }
    });
}
