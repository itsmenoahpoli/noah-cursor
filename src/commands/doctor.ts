import { Command } from "commander";
import chalk from "chalk";
import { handleCommandError, logTitle } from "../core/logger.js";
import { IDE_IDS, parseIdeId } from "../constants/index.js";
import { runDoctor } from "../services/doctor-service.js";

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Diagnose Noah Cursor environment and installation health")
    .option(
      "--ide <name>",
      `Target IDE (${IDE_IDS.join("|")})`,
      "cursor",
    )
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { verbose?: boolean; ide?: string }) => {
      try {
        const ide = parseIdeId(opts.ide);
        const checks = await runDoctor(process.cwd(), ide);
        logTitle(`Noah Cursor Doctor · ${ide}`);

        let failures = 0;
        for (const check of checks) {
          const icon =
            check.status === "pass"
              ? chalk.green("✔")
              : check.status === "warn"
                ? chalk.yellow("⚠")
                : chalk.red("✖");
          console.log(`  ${icon} ${chalk.bold(check.name)}: ${check.message}`);
          if (check.status === "fail") failures += 1;
        }

        console.log();
        if (failures > 0) {
          console.log(chalk.red(`${failures} check(s) failed.`));
          process.exitCode = 1;
        } else {
          console.log(chalk.green("All critical checks passed."));
        }
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });
}
