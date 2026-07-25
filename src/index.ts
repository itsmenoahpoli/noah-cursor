#!/usr/bin/env node
import { createProgram } from "./core/program.js";
import { renderBanner } from "./ui/banner.js";
import { resolveHomeArgv } from "./ui/homeMenu.js";
import { analyzeProject } from "./services/project-awareness.js";
import chalk from "chalk";
import { logTitle } from "./core/logger.js";

async function main(): Promise<void> {
  const program = createProgram();
  const args = process.argv.slice(2);

  // No arguments: interactive home on TTY, else smart project summary + help
  if (args.length === 0) {
    renderBanner(true);

    if (process.stdout.isTTY && process.env.NOAH_CURSOR_NO_HOME !== "1") {
      const homeArgs = await resolveHomeArgv();
      if (!homeArgs) return;
      process.argv = [process.argv[0]!, process.argv[1]!, ...homeArgs];
      await createProgram().parseAsync(process.argv);
      return;
    }

    // Non-interactive: show project-aware north-star summary then help
    try {
      const analysis = await analyzeProject(process.cwd());
      if (analysis.stack.frameworks.length > 0 || analysis.recommendations.length > 0) {
        logTitle("Project Detected");
        console.log(
          `  ${chalk.bold(analysis.stack.frameworks.join(", ") || "Unknown")}  ·  Health ${Math.round(analysis.health.overall * 10)}%`,
        );
        if (analysis.missing.length) {
          console.log(chalk.yellow(`  Missing: ${analysis.missing.join(", ")}`));
        }
        if (analysis.recommendations.length) {
          console.log(chalk.dim("  Recommended:"));
          for (const r of analysis.recommendations.slice(0, 5)) {
            console.log(chalk.dim(`    ✓ ${r.type}/${r.id}`));
          }
          console.log();
          console.log(chalk.dim("  Run `noah-cursor bootstrap` to review and install recommendations."));
          console.log();
        }
      }
    } catch {
      // ignore analysis failures on bare invoke
    }

    program.outputHelp();
    return;
  }

  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
