import { Command } from "commander";
import chalk from "chalk";
import { handleCommandError, logInfo, logSuccess, logTitle } from "../core/logger.js";
import { IDE_IDS, parseIdeId } from "../constants/index.js";
import {
  appendAudit,
  getSettings,
  listFavorites,
  readUserStore,
  updateSettings,
} from "../metadata/user-store.js";
import { previewDiff } from "../services/extras.js";

export function registerConfigCommands(program: Command): void {
  program
    .command("config")
    .description("Show or update Noah user settings (~/.noah)")
    .option("--ide <name>", "Set default IDE")
    .option("--private-registry <url>", "Set private registry URL")
    .option("--analytics <bool>", "Enable/disable analytics (true|false)")
    .option("-v, --verbose", "Verbose output", false)
    .action(
      async (opts: {
        ide?: string;
        privateRegistry?: string;
        analytics?: string;
        verbose?: boolean;
      }) => {
        try {
          const patch: Record<string, unknown> = {};
          if (opts.ide) patch.defaultIde = parseIdeId(opts.ide);
          if (opts.privateRegistry) patch.privateRegistry = opts.privateRegistry;
          if (opts.analytics != null) {
            patch.analytics = opts.analytics === "true" || opts.analytics === "1";
          }

          if (Object.keys(patch).length > 0) {
            const settings = await updateSettings(patch);
            await appendAudit("config", JSON.stringify(patch));
            logSuccess("Settings updated.");
            console.log(settings);
            return;
          }

          const store = await readUserStore();
          const settings = await getSettings();
          const favorites = await listFavorites();
          logTitle("Noah settings (~/.noah)");
          console.log(`  Default IDE:       ${settings.defaultIde ?? "cursor"}`);
          console.log(`  Private registry:  ${settings.privateRegistry ?? "—"}`);
          console.log(`  Analytics:         ${settings.analytics ?? false}`);
          console.log(`  Plugins:           ${(settings.plugins ?? []).join(", ") || "—"}`);
          console.log(`  Favorites:         ${favorites.length}`);
          console.log(`  Recent:            ${store.recent.length}`);
          console.log(`  Audit log:         ${store.auditLog.length} events`);
          if (store.auth?.username) {
            console.log(`  Logged in as:      ${chalk.bold(store.auth.username)}`);
          }
        } catch (error) {
          handleCommandError(error, opts.verbose);
        }
      },
    );

  program
    .command("diff")
    .description("Preview file changes before installing a package")
    .argument("<package>", "Package name")
    .option("--ide <name>", `Target IDE (${IDE_IDS.join("|")})`, "cursor")
    .option("--target <name>", "Alias for --ide")
    .option("-v, --verbose", "Verbose output", false)
    .action(
      async (
        pkg: string,
        opts: { ide?: string; target?: string; verbose?: boolean },
      ) => {
        try {
          const ide = parseIdeId(opts.target ?? opts.ide);
          await previewDiff(pkg, { ide, verbose: opts.verbose });
        } catch (error) {
          handleCommandError(error, opts.verbose);
        }
      },
    );

  program
    .command("trending")
    .description("Show trending packages")
    .option("--period <name>", "today|week|month", "week")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { period?: string; verbose?: boolean }) => {
      try {
        const { listTrending } = await import("../services/ecosystem.js");
        const period = (opts.period as "today" | "week" | "month") ?? "week";
        const items = await listTrending(period, { verbose: opts.verbose });
        logTitle(`Trending · ${period}`);
        for (const item of items) {
          const stars = item.rating != null ? `★${item.rating}` : "";
          console.log(
            `  ${chalk.cyan(item.type.padEnd(7))} ${chalk.bold(item.id)}  ↓${item.downloads ?? 0}  ${stars}`,
          );
        }
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });

  program
    .command("audit")
    .description("Show enterprise audit log")
    .option("--limit <n>", "Max events", "20")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: { limit?: string; verbose?: boolean }) => {
      try {
        const store = await readUserStore();
        const limit = Number(opts.limit ?? 20);
        logTitle("Audit log");
        if (store.auditLog.length === 0) {
          logInfo("No audit events yet.");
          return;
        }
        for (const event of store.auditLog.slice(0, limit)) {
          console.log(
            `  ${chalk.dim(event.at)}  ${chalk.bold(event.action)}  ${event.detail ?? ""}`,
          );
        }
      } catch (error) {
        handleCommandError(error, opts.verbose);
      }
    });
}
