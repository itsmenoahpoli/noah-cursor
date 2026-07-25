import { Command } from "commander";
import chalk from "chalk";
import { handleCommandError, logInfo, logSuccess, logTitle } from "../core/logger.js";
import { addFavorite, listFavorites, removeFavorite } from "../metadata/user-store.js";
import { resolvePackageRequest } from "../services/install-service.js";

export function registerFavoriteCommands(program: Command): void {
  const favorite = program
    .command("favorite")
    .description("Manage favorite packages");

  favorite
    .command("add")
    .description("Add a package to favorites")
    .argument("<package>", "Package name")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (pkg: string, opts: { verbose?: boolean }) => {
      try {
        const resolved = await resolvePackageRequest(pkg, undefined, { verbose: opts.verbose });
        await addFavorite(resolved.type, resolved.id);
        logSuccess(`Favorited ${resolved.type}/${resolved.id}`);
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });

  favorite
    .command("remove")
    .alias("rm")
    .description("Remove a package from favorites")
    .argument("<package>", "Package name")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (pkg: string, opts: { verbose?: boolean }) => {
      try {
        const resolved = await resolvePackageRequest(pkg, undefined, { verbose: opts.verbose });
        const ok = await removeFavorite(resolved.type, resolved.id);
        if (ok) logSuccess(`Removed ${resolved.type}/${resolved.id} from favorites`);
        else logInfo("Not in favorites.");
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });

  program
    .command("favorites")
    .description("List favorite packages")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { verbose?: boolean }) => {
      try {
        const favorites = await listFavorites();
        if (favorites.length === 0) {
          logInfo("No favorites yet. Use `noah-cursor favorite add <package>`.");
          return;
        }
        logTitle(`Favorites (${favorites.length})`);
        for (const entry of favorites) {
          console.log(
            `  ${chalk.cyan(entry.type.padEnd(7))} ${chalk.bold(entry.id)} ${chalk.dim(entry.addedAt)}`,
          );
        }
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });
}
