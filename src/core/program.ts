import { Command } from "commander";
import { CLI_NAME, CLI_VERSION } from "../constants/index.js";
import { registerAddCommand } from "../commands/add.js";
import { registerBrowseCommand } from "../commands/browse.js";
import { registerSearchCommand } from "../commands/search.js";
import { registerListCommand } from "../commands/list.js";
import { registerRemoveCommand } from "../commands/remove.js";
import { registerUpdateCommand } from "../commands/update.js";
import { registerDoctorCommand } from "../commands/doctor.js";
import { registerInstallCommand } from "../commands/install.js";
import { registerUninstallCommand } from "../commands/uninstall.js";
import { registerPreviewCommand } from "../commands/preview.js";
import { registerRecentCommand } from "../commands/recent.js";
import { registerFavoriteCommands } from "../commands/favorite.js";
import { registerBootstrapCommand } from "../commands/bootstrap.js";
import { registerWorkspaceCommand } from "../commands/workspace.js";
import { registerExplainCommand } from "../commands/explain.js";
import { registerAnalyzeCommand } from "../commands/analyze.js";
import { registerWizardCommands } from "../commands/wizard.js";
import { registerDashboardCommand } from "../commands/dashboard.js";
import { registerPluginCommand } from "../commands/plugin.js";
import { registerUndoCommand } from "../commands/undo.js";
import { registerTryCommand } from "../commands/try.js";
import { registerNewCommand } from "../commands/new.js";
import { registerConfigCommands } from "../commands/config.js";
import { renderBanner, shouldShowBanner } from "../ui/banner.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name(CLI_NAME)
    .description(
      "The package manager for AI-assisted software development — Skills, Rules, Prompts, MCP, Presets",
    )
    .version(CLI_VERSION)
    .option("--no-banner", "Hide the NOAH DEV CLI banner")
    .showHelpAfterError()
    .showSuggestionAfterError();

  program.configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

  program.addHelpText("beforeAll", () => {
    if (shouldShowBanner()) {
      renderBanner();
    }
    return "";
  });

  program.hook("preAction", () => {
    renderBanner();
  });

  // Root action: help when routed without subcommand (TTY home is handled in index.ts)
  program.action(() => {
    renderBanner();
    program.outputHelp();
  });

  registerAddCommand(program);
  registerInstallCommand(program);
  registerBrowseCommand(program);
  registerSearchCommand(program);
  registerPreviewCommand(program);
  registerListCommand(program);
  registerRemoveCommand(program);
  registerUninstallCommand(program);
  registerUpdateCommand(program);
  registerDoctorCommand(program);
  registerRecentCommand(program);
  registerFavoriteCommands(program);
  registerBootstrapCommand(program);
  registerWorkspaceCommand(program);
  registerExplainCommand(program);
  registerAnalyzeCommand(program);
  registerWizardCommands(program);
  registerDashboardCommand(program);
  registerPluginCommand(program);
  registerUndoCommand(program);
  registerTryCommand(program);
  registerNewCommand(program);
  registerConfigCommands(program);

  return program;
}
