import { Command } from "commander";
import chalk from "chalk";
import { handleCommandError, logInfo, logTitle } from "../core/logger.js";
import { addPlugin, listPlugins } from "../services/extras.js";

export function registerPluginCommand(program: Command): void {
  const plugin = program.command("plugin").description("Manage Noah plugins");

  plugin
    .command("add")
    .description("Enable a plugin")
    .argument("<name>", "Plugin name")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (name: string, opts: { verbose?: boolean }) => {
      try {
        await addPlugin(name);
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });

  plugin
    .command("list")
    .description("List enabled plugins")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { verbose?: boolean }) => {
      try {
        const plugins = await listPlugins();
        if (plugins.length === 0) {
          logInfo("No plugins enabled.");
          return;
        }
        logTitle("Plugins");
        for (const p of plugins) console.log(`  ${chalk.bold(p)}`);
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });
}
