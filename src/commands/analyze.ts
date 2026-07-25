import { Command } from "commander";
import chalk from "chalk";
import { createSpinner, handleCommandError, logTitle } from "../core/logger.js";
import { IDE_IDS, parseIdeId } from "../constants/index.js";
import { runAnalyze } from "../services/intelligence.js";

export function registerAnalyzeCommand(program: Command): void {
  program
    .command("analyze")
    .description("Analyze the project for stack, health, and missing workflows")
    .option("--ide <name>", `Target IDE (${IDE_IDS.join("|")})`, "cursor")
    .option("--target <name>", "Alias for --ide")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { ide?: string; target?: string; verbose?: boolean }) => {
      const spinner = createSpinner("Analyzing…");
      try {
        const ide = parseIdeId(opts.target ?? opts.ide);
        spinner.start();
        const analysis = await runAnalyze(ide, opts.verbose);
        spinner.stop();

        logTitle("Stack");
        console.log(`  Frameworks: ${analysis.stack.frameworks.join(", ") || "—"}`);
        console.log(`  Languages:  ${analysis.stack.languages.join(", ") || "—"}`);
        console.log(`  Tools:      ${analysis.stack.tools.join(", ") || "—"}`);

        logTitle("Health");
        const h = analysis.health;
        console.log(`  Architecture   ${chalk.bold(h.architecture)}`);
        console.log(`  Security       ${chalk.bold(h.security)}`);
        console.log(`  Documentation  ${chalk.bold(h.documentation)}`);
        console.log(`  Testing        ${chalk.bold(h.testing)}`);
        console.log(`  Overall        ${chalk.bold(h.overall)} (${Math.round(h.overall * 10)}%)`);

        if (analysis.missing.length) {
          logTitle("Missing");
          for (const m of analysis.missing) console.log(`  • ${m}`);
        }

        if (analysis.recommendations.length) {
          logTitle("Suggested installs");
          for (const r of analysis.recommendations) {
            console.log(`  ${chalk.cyan(r.type)}/${chalk.bold(r.id)}`);
          }
        }
      } catch (error) {
        spinner.stop();
        handleCommandError(error, opts.verbose);
      }
    });
}
