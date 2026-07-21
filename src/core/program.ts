import { Command } from "commander";
import { CLI_NAME, CLI_VERSION } from "../constants/index.js";
import { registerAddCommand } from "../commands/add.js";
import { registerSearchCommand } from "../commands/search.js";
import { registerListCommand } from "../commands/list.js";
import { registerRemoveCommand } from "../commands/remove.js";
import { registerUpdateCommand } from "../commands/update.js";
import { registerDoctorCommand } from "../commands/doctor.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name(CLI_NAME)
    .description(
      "Install reusable Cursor assets (Skills, Rules, Prompts, MCP, Presets) from GitHub registries",
    )
    .version(CLI_VERSION)
    .showHelpAfterError()
    .showSuggestionAfterError();

  registerAddCommand(program);
  registerSearchCommand(program);
  registerListCommand(program);
  registerRemoveCommand(program);
  registerUpdateCommand(program);
  registerDoctorCommand(program);

  return program;
}
