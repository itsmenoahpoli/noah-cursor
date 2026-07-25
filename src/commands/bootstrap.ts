import { Command } from "commander";
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import {
  createSpinner,
  handleCommandError,
  logInfo,
  logTitle,
  logWarn,
} from "../core/logger.js";
import { IDE_IDS, parseIdeId } from "../constants/index.js";
import { applyBootstrap, planBootstrap } from "../services/workspace-service.js";
import { isPromptExit } from "../ui/prompt-errors.js";

export function registerBootstrapCommand(program: Command): void {
  program
    .command("bootstrap")
    .description("Detect project stack, recommend packages, and install them")
    .option("--ide <name>", `Target IDE (${IDE_IDS.join("|")})`, "cursor")
    .option("--target <name>", "Alias for --ide")
    .option("--all", "Recommend all matches (not just top 5)", false)
    .option("--dry-run", "Analyze and show plan without installing", false)
    .option("-y, --yes", "Skip confirmation and install recommendations", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(
      async (opts: {
        ide?: string;
        target?: string;
        all?: boolean;
        dryRun?: boolean;
        yes?: boolean;
        verbose?: boolean;
      }) => {
        const spinner = createSpinner("Analyzing project…");
        try {
          const ide = parseIdeId(opts.target ?? opts.ide);
          spinner.start();
          const plan = await planBootstrap(
            { ide, all: opts.all, verbose: opts.verbose },
            process.cwd(),
          );
          spinner.stop();

          logTitle("Project detected");
          console.log(
            `  ${chalk.bold(plan.analysis.stack.frameworks.join(", ") || "Unknown stack")}`,
          );
          if (plan.analysis.stack.tools.length) {
            console.log(chalk.dim(`  Tools: ${plan.analysis.stack.tools.join(", ")}`));
          }
          console.log();
          console.log(`  Health score  ${Math.round(plan.analysis.health.overall * 10)}%`);
          console.log(
            chalk.dim(
              `  Architecture ${plan.analysis.health.architecture} · Security ${plan.analysis.health.security} · Docs ${plan.analysis.health.documentation} · Testing ${plan.analysis.health.testing}`,
            ),
          );
          if (plan.analysis.missing.length) {
            console.log();
            console.log(chalk.yellow(`  Missing: ${plan.analysis.missing.join(", ")}`));
          }

          if (plan.packages.length === 0) {
            logInfo("No recommended packages for this project.");
            return;
          }

          logTitle("Recommended packages");
          for (const pkg of plan.packages) {
            console.log(`  ✓ ${pkg}`);
          }
          console.log();

          if (opts.dryRun) {
            logInfo(`[dry-run] Would install ${plan.packages.length} package(s).`);
            return;
          }

          let shouldInstall = Boolean(opts.yes);
          if (!shouldInstall) {
            try {
              shouldInstall = await confirm({
                message: `Install ${plan.packages.length} recommended package(s)?`,
                default: true,
              });
            } catch (error) {
              if (isPromptExit(error)) {
                logInfo("Bootstrap cancelled.");
                return;
              }
              throw error;
            }
          }

          if (!shouldInstall) {
            logWarn("Skipped install. Run again with -y to install, or use browse/install.");
            return;
          }

          const installSpinner = createSpinner("Installing recommended packages…");
          try {
            installSpinner.start();
            const results = await applyBootstrap(
              plan,
              { yes: true, dryRun: false, verbose: opts.verbose },
              process.cwd(),
            );
            installSpinner.stop();

            if (results.length) {
              logTitle("Installed");
              for (const r of results.filter((x) => !x.skipped)) {
                console.log(`  ${chalk.green("✔")} ${r.type}/${r.id}@${r.version}`);
              }
            }
          } catch (error) {
            installSpinner.stop();
            throw error;
          }
        } catch (error) {
          spinner.stop();
          handleCommandError(error, opts.verbose);
        }
      },
    );
}
