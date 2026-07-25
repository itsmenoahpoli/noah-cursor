import { Command } from "commander";
import chalk from "chalk";
import { createSpinner, handleCommandError, logInfo, logTitle } from "../core/logger.js";
import { IDE_IDS, WORKSPACE_FILE, parseIdeId } from "../constants/index.js";
import {
  initWorkspace,
  readWorkspace,
  syncWorkspace,
  writeWorkspace,
} from "../services/workspace-service.js";

export function registerWorkspaceCommand(program: Command): void {
  const workspace = program
    .command("workspace")
    .description("Manage team workspace configuration (noah.config.json)");

  workspace
    .command("init")
    .description(`Create ${WORKSPACE_FILE}`)
    .option("--ide <name>", `Default IDE (${IDE_IDS.join("|")})`, "cursor")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { ide?: string; verbose?: boolean }) => {
      try {
        const ide = parseIdeId(opts.ide);
        await initWorkspace({ ide });
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });

  workspace
    .command("show")
    .description(`Show ${WORKSPACE_FILE}`)
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { verbose?: boolean }) => {
      try {
        const config = await readWorkspace();
        if (!config) {
          logInfo(`No ${WORKSPACE_FILE} found. Run \`noah-cursor workspace init\`.`);
          return;
        }
        logTitle(WORKSPACE_FILE);
        console.log(`  IDE: ${config.ide ?? "cursor"}`);
        console.log(`  Packages (${config.packages.length}):`);
        for (const pkg of config.packages) {
          console.log(`    • ${chalk.bold(pkg)}`);
        }
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });

  workspace
    .command("add")
    .description("Add a package to the workspace config")
    .argument("<package>", "Package name")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (pkg: string, opts: { verbose?: boolean }) => {
      try {
        const config = (await readWorkspace()) ?? { packages: [] };
        if (!config.packages.includes(pkg)) {
          config.packages.push(pkg);
          await writeWorkspace(config);
        }
        logInfo(`Workspace packages: ${config.packages.join(", ")}`);
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });

  program
    .command("sync")
    .description(`Install packages from ${WORKSPACE_FILE}`)
    .option("--dry-run", "Show what would be installed", false)
    .option("-y, --yes", "Skip confirmation prompts", false)
    .option("--force", "Overwrite existing assets", true)
    .option("-v, --verbose", "Verbose output", false)
    .action(
      async (opts: { dryRun?: boolean; yes?: boolean; force?: boolean; verbose?: boolean }) => {
        const spinner = createSpinner("Syncing workspace…");
        try {
          spinner.start();
          const results = await syncWorkspace(opts);
          spinner.stop();
          logTitle(`Synced ${results.filter((r) => !r.skipped).length} asset(s)`);
        } catch (error) {
          spinner.stop();
          handleCommandError(error, opts.verbose);
        }
      },
    );
}
