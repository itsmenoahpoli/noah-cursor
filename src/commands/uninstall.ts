import { Command } from "commander";
import { createSpinner, handleCommandError } from "../core/logger.js";
import { ASSET_TYPES, IDE_IDS, parseIdeId } from "../constants/index.js";
import { removeAsset, resolvePackageRequest } from "../services/install-service.js";
import { ValidationError } from "../core/errors.js";
import type { AssetType } from "../types/index.js";
import { parsePackageRef } from "../utils/semver.js";

export function registerUninstallCommand(program: Command): void {
  program
    .command("uninstall")
    .description("Uninstall a package by name or type/id")
    .argument("<package>", "Package name (e.g. laravel-api or rule/laravel-api)")
    .option("--ide <name>", `Target IDE (${IDE_IDS.join("|")})`, "cursor")
    .option("--target <name>", "Alias for --ide")
    .option("--force", "Remove even if not in metadata", false)
    .option("--dry-run", "Show what would be removed", false)
    .option("-y, --yes", "Skip confirmation prompts", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(
      async (
        pkg: string,
        opts: {
          force?: boolean;
          dryRun?: boolean;
          yes?: boolean;
          verbose?: boolean;
          ide?: string;
          target?: string;
        },
      ) => {
        const spinner = createSpinner(`Uninstalling ${pkg}…`);
        try {
          const ide = parseIdeId(opts.target ?? opts.ide);
          const ref = parsePackageRef(pkg);
          let type: AssetType;
          let id: string;

          if (ref.type && ASSET_TYPES.includes(ref.type as AssetType)) {
            type = ref.type as AssetType;
            id = ref.id;
          } else {
            const resolved = await resolvePackageRequest(pkg, undefined, { verbose: opts.verbose });
            type = resolved.type;
            id = resolved.id;
          }

          if (!ASSET_TYPES.includes(type)) {
            throw new ValidationError(`Invalid type for ${pkg}`);
          }

          spinner.start();
          await removeAsset(type, id, {
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
