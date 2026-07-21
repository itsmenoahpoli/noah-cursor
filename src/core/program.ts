import { Command } from "commander";
import { CLI_NAME, CLI_VERSION } from "../constants/index.js";
import { registerAddCommand } from "../commands/add.js";
import { registerBrowseCommand } from "../commands/browse.js";
import { registerSearchCommand } from "../commands/search.js";
import { registerListCommand } from "../commands/list.js";
import { registerRemoveCommand } from "../commands/remove.js";
import { registerUpdateCommand } from "../commands/update.js";
import { registerDoctorCommand } from "../commands/doctor.js";
import { renderBanner, shouldShowBanner } from "../ui/banner.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name(CLI_NAME)
    .description(
      "Install Noah's reusable Cursor assets (Skills, Rules, Prompts, MCP, Presets)",
    )
    .version(CLI_VERSION)
    .option("--no-banner", "Hide the NOAH DEV CLI banner")
    .showHelpAfterError()
    .showSuggestionAfterError();

  // Show branding above help (`noah-cursor`, `noah-cursor --help`, `… help`)
  program.configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

  program.addHelpText("beforeAll", () => {
    // Banner for explicit --help / help command (empty argv is handled in index.ts)
    if (shouldShowBanner()) {
      renderBanner();
    }
    return "";
  });

  // Show branding before every subcommand action
  program.hook("preAction", () => {
    renderBanner();
  });

  // If Commander still routes to the root with no subcommand, show help (exit 0)
  program.action(() => {
    renderBanner();
    program.outputHelp();
  });

  registerAddCommand(program);
  registerBrowseCommand(program);
  registerSearchCommand(program);
  registerListCommand(program);
  registerRemoveCommand(program);
  registerUpdateCommand(program);
  registerDoctorCommand(program);

  return program;
}
