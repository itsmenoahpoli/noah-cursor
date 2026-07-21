import { Command } from "commander";
import chalk from "chalk";
import { handleCommandError, logWarn } from "../core/logger.js";
import { installFromSelections } from "../services/install-service.js";
import { loadRegistry } from "../services/registry-loader.js";
import type { AssetRequest, AssetType, Manifest } from "../types/index.js";
import { getManifestAssets } from "../utils/assets.js";
import { displayRegistryUrl } from "../utils/fs.js";
import { resolveNoahRegistry } from "../utils/registry.js";
import { selectCategories, type BrowseCategory } from "../ui/categoryMenu.js";
import { selectAssets } from "../ui/assetMenu.js";
import { confirmInstallation } from "../ui/summary.js";
import { ProgressDisplay } from "../ui/progress.js";
import { humanizeId } from "../ui/format.js";

interface BrowseOptions {
  browseSkills?: boolean;
  browseRules?: boolean;
  browsePrompts?: boolean;
  browseMcp?: boolean;
  browsePresets?: boolean;
  force?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  verbose?: boolean;
}

function categoriesFromFlags(opts: BrowseOptions): BrowseCategory[] {
  const selected: BrowseCategory[] = [];
  if (opts.browseSkills) selected.push("skill");
  if (opts.browseRules) selected.push("rule");
  if (opts.browsePrompts) selected.push("prompt");
  if (opts.browseMcp) selected.push("mcp");
  if (opts.browsePresets) selected.push("preset");
  return selected;
}

function assetsForCategory(manifest: Manifest, type: AssetType) {
  if (type === "preset") {
    return manifest.presets;
  }
  return getManifestAssets(manifest, type);
}

async function collectSelections(
  manifest: Manifest,
  categories: BrowseCategory[],
): Promise<AssetRequest[] | null> {
  const selections: AssetRequest[] = [];

  for (const category of categories) {
    const assets = assetsForCategory(manifest, category);
    const chosen = await selectAssets(category, assets);
    if (chosen === null) {
      return null;
    }
    for (const id of chosen) {
      selections.push({ type: category, id });
    }
    console.log();
  }

  return selections;
}

export function registerBrowseCommand(program: Command): void {
  program
    .command("browse")
    .description("Interactively browse and install assets from Noah's official registry")
    .argument(
      "[repository]",
      "Local path for development (default: bundled Noah registry)",
    )
    .option("--browse-skills", "Browse skills only", false)
    .option("--browse-rules", "Browse rules only", false)
    .option("--browse-prompts", "Browse prompts only", false)
    .option("--browse-mcp", "Browse MCP configs only", false)
    .option("--browse-presets", "Browse presets only", false)
    .option("--force", "Overwrite existing assets", false)
    .option("--dry-run", "Show what would be installed without writing files", false)
    .option("-y, --yes", "Skip final confirmation", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(async (repository: string | undefined, opts: BrowseOptions) => {
      const progress = new ProgressDisplay();

      try {
        progress.start("Loading registry…");
        const source = resolveNoahRegistry(repository);
        const registry = await loadRegistry(source, { verbose: opts.verbose });
        progress.succeed("Loading registry");

        progress.start("Reading manifest…");
        const { manifest } = registry;
        progress.succeed(
          `Reading manifest${manifest.name ? chalk.dim(` (${manifest.name}@${manifest.version})`) : ""}`,
        );
        console.log();

        try {
          const flagged = categoriesFromFlags(opts);
          const categories = await selectCategories(flagged.length > 0 ? flagged : undefined);

          if (!categories || categories.length === 0) {
            logWarn("No categories selected. Exiting.");
            return;
          }

          console.log();
          const selections = await collectSelections(manifest, categories);

          if (selections === null) {
            logWarn("Browse cancelled.");
            return;
          }

          if (selections.length === 0) {
            logWarn("No assets selected. Nothing to install.");
            return;
          }

          const shouldInstall =
            opts.yes ||
            opts.dryRun ||
            (await confirmInstallation(registry.url, selections));

          if (!shouldInstall) {
            logWarn("Installation cancelled.");
            return;
          }

          console.log();
          const formatStep = (message: string): string =>
            message.startsWith("Installing ")
              ? message.replace(
                  /^Installing ([^/]+)\/(.+)$/,
                  (_full, type: string, id: string) =>
                    `Installing ${humanizeId(id)} ${chalk.dim(`(${type})`)}`,
                )
              : message;

          const results = await installFromSelections(registry, selections, {
            force: opts.force,
            dryRun: opts.dryRun,
            verbose: opts.verbose,
            onStepStart: async (message) => {
              progress.start(formatStep(message));
            },
            onStepDone: async (message) => {
              progress.succeed(formatStep(message));
            },
          });

          progress.succeed(opts.dryRun ? "Dry run complete" : "Installation complete");

          const installed = results.filter((r) => !r.skipped);
          console.log();
          console.log(
            chalk.green(
              `${opts.dryRun ? "Planned" : "Installed"} ${installed.length} asset(s) from ${displayRegistryUrl(registry.url)}`,
            ),
          );
        } finally {
          await registry.cleanup();
        }
      } catch (error) {
        progress.fail("Browse failed");
        handleCommandError(error, opts.verbose);
      }
    });
}
