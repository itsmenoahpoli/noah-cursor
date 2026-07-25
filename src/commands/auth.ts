import { Command } from "commander";
import { handleCommandError, logInfo, logSuccess } from "../core/logger.js";
import { getAnalyticsSummary, login, logout, whoami } from "../services/ecosystem.js";
import { isPromptExit } from "../ui/prompt-errors.js";

export function registerAuthCommands(program: Command): void {
  program
    .command("login")
    .description("Log in for publish / team features (local token)")
    .argument("[username]", "Username or email")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (username: string | undefined, opts: { verbose?: boolean }) => {
      try {
        await login(username);
      } catch (error) {
        if (isPromptExit(error)) {
          logInfo("Cancelled.");
          return;
        }
        handleCommandError(error, opts.verbose);
      }
    });

  program
    .command("logout")
    .description("Clear local auth")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { verbose?: boolean }) => {
      try {
        await logout();
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });

  program
    .command("whoami")
    .description("Show logged-in user")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { verbose?: boolean }) => {
      try {
        const user = await whoami();
        if (user) logSuccess(user);
        else logInfo("Not logged in.");
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });

  program
    .command("analytics")
    .description("Show local usage analytics summary")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { verbose?: boolean }) => {
      try {
        const summary = await getAnalyticsSummary();
        console.log(`  Favorites:     ${summary.favorites}`);
        console.log(`  Recent:        ${summary.recent}`);
        console.log(`  Audit events:  ${summary.auditEvents}`);
        console.log(`  Logged in:     ${summary.loggedIn ? "yes" : "no"}`);
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });
}
