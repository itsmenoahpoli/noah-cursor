import { Command } from "commander";
import { createSpinner, handleCommandError } from "../core/logger.js";
import { removeAsset } from "../services/install-service.js";
import { ASSET_TYPES, IDE_IDS, parseIdeId } from "../constants/index.js";
import type { AssetType } from "../types/index.js";
import { ValidationError } from "../core/errors.js";

export function registerRemoveCommand(program: Command): void {
  program
    .command("remove")
    .alias("rm")
    .description("Remove an installed asset")
    .argument("<type>", `Asset type (${ASSET_TYPES.join("|")})`)
    .argument("<id>", "Asset id")
    .option(
      "--ide <name>",
      `Target IDE (${IDE_IDS.join("|")})`,
      "cursor",
    )
    .option("--force", "Remove even if not in metadata", false)
    .option("--dry-run", "Show what would be removed", false)
    .option("-y, --yes", "Skip confirmation prompts", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(
      async (
        type: string,
        id: string,
        opts: {
          force?: boolean;
          dryRun?: boolean;
          yes?: boolean;
          verbose?: boolean;
          ide?: string;
        },
      ) => {
        const spinner = createSpinner(`Removing ${type}/${id}…`);
        try {
          if (!ASSET_TYPES.includes(type as AssetType)) {
            throw new ValidationError(
              `Invalid asset type "${type}". Expected one of: ${ASSET_TYPES.join(", ")}`,
            );
          }

          const ide = parseIdeId(opts.ide);
          spinner.start();
          await removeAsset(type as AssetType, id, {
            force: opts.force,
            dryRun: opts.dryRun,
            yes: opts.yes,
            verbose: opts.verbose,
            ide,
          });
          spinner.stop();
        } catch (error) {
          spinner.stop();
          handleCommandError(error, opts.verbose);
        }
      },
    );
}
