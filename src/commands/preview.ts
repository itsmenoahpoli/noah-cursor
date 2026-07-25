import { Command } from "commander";
import { createSpinner, handleCommandError } from "../core/logger.js";
import { getPackagePreview } from "../services/install-service.js";
import { renderPackagePreview } from "../ui/preview.js";

export function registerPreviewCommand(program: Command): void {
  program
    .command("preview")
    .alias("show")
    .description("Preview a package before installation")
    .argument("<package>", "Package name")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (pkg: string, opts: { verbose?: boolean }) => {
      const spinner = createSpinner("Loading package…");
      try {
        spinner.start();
        const preview = await getPackagePreview(pkg, { verbose: opts.verbose });
        spinner.stop();
        renderPackagePreview(preview);
      } catch (error) {
        spinner.stop();
        handleCommandError(error, opts.verbose);
      }
    });
}
