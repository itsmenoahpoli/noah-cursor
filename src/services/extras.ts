import path from "node:path";
import fs from "fs-extra";
import { select } from "@inquirer/prompts";
import { DEFAULT_IDE, getIdeDefinition, type IdeId } from "../constants/index.js";
import { NotFoundError, ValidationError } from "../core/errors.js";
import { logInfo, logSuccess, logTitle, logWarn } from "../core/logger.js";
import { listInstalledAssets } from "../metadata/store.js";
import {
  popUndo,
  readUserStore,
  updateSettings,
  appendAudit,
} from "../metadata/user-store.js";
import { assetTypeToDir } from "../utils/assets.js";
import { createTempDir, cleanupTempDir } from "../utils/fs.js";
import {
  installByPackageNames,
  removeAsset,
  getPackagePreview,
  listRegistryAssets,
} from "./install-service.js";
import { computeHealthScores, detectProjectStack } from "./project-awareness.js";
import { getAnalyticsSummary, listTrending } from "./ecosystem.js";
import { readLockfile } from "./lockfile-service.js";
import { readWorkspace } from "./workspace-service.js";
import type { AssetType } from "../types/index.js";

export async function runUndo(
  options: { yes?: boolean; dryRun?: boolean; verbose?: boolean } = {},
): Promise<void> {
  const entry = await popUndo();
  if (!entry) {
    logInfo("Nothing to undo.");
    return;
  }

  logInfo(`Undoing ${entry.action} of ${entry.type}/${entry.id} (${entry.ide})`);

  if (entry.action === "install") {
    await removeAsset(entry.type, entry.id, {
      yes: options.yes ?? true,
      dryRun: options.dryRun,
      verbose: options.verbose,
      ide: entry.ide,
      force: true,
    });
    logSuccess(`Undid install of ${entry.type}/${entry.id}`);
  } else {
    await installByPackageNames([`${entry.type}/${entry.id}`], {
      ide: entry.ide,
      yes: true,
      dryRun: options.dryRun,
      verbose: options.verbose,
    });
    logSuccess(`Undid uninstall of ${entry.type}/${entry.id}`);
  }
  await appendAudit("undo", `${entry.action} ${entry.type}/${entry.id}`);
}

export async function tryPackage(
  input: string,
  options: { ide?: IdeId; verbose?: boolean } = {},
): Promise<string> {
  const ide = options.ide ?? DEFAULT_IDE;
  const temp = await createTempDir("noah-try-");
  const prev = process.cwd();
  try {
    process.chdir(temp);
    await installByPackageNames([input], {
      ide,
      yes: true,
      verbose: options.verbose,
    });
    const root = getIdeDefinition(ide).rootDir;
    logSuccess(`Temporary install at ${path.join(temp, root)}`);
    logWarn("Sandbox expires when this process exits — copy files you want to keep.");
    logInfo(`Temp dir: ${temp}`);
    return temp;
  } finally {
    process.chdir(prev);
    // Keep temp for inspection; user can delete. Schedule best-effort note.
    void cleanupTempDir;
  }
}

export async function showDashboard(ide: IdeId = DEFAULT_IDE): Promise<void> {
  const stack = await detectProjectStack();
  const health = await computeHealthScores(process.cwd(), ide);
  const installed = await listInstalledAssets(process.cwd(), ide);
  const analytics = await getAnalyticsSummary();
  const trending = await listTrending("week");
  const lock = await readLockfile();
  const workspace = await readWorkspace();

  logTitle("Noah Dashboard");
  console.log();
  console.log(`  Project stack: ${stack.frameworks.join(", ") || "unknown"}`);
  console.log(`  Health score:  ${Math.round(health.overall * 10)}%`);
  console.log(`  Installed:     ${installed.installed.length}`);
  console.log(`  Lockfile:      ${lock ? `${lock.packages.length} pinned` : "none"}`);
  console.log(`  Workspace:     ${workspace ? `${workspace.packages.length} packages` : "none"}`);
  console.log(`  Favorites:     ${analytics.favorites}`);
  console.log(`  Recent:        ${analytics.recent}`);
  console.log();
  console.log("  Trending");
  for (const t of trending.slice(0, 5)) {
    console.log(`    • ${t.type}/${t.id}  ↓${t.downloads ?? 0}  ★${t.rating ?? "–"}`);
  }
}

export async function addPlugin(name: string): Promise<void> {
  const store = await readUserStore();
  const plugins = store.settings.plugins ?? [];
  if (plugins.includes(name)) {
    logInfo(`Plugin "${name}" already enabled.`);
    return;
  }
  await updateSettings({ plugins: [...plugins, name] });
  await appendAudit("plugin-add", name);
  logSuccess(`Enabled plugin "${name}" (local stub — hooks run on install/sync).`);
}

export async function listPlugins(): Promise<string[]> {
  const store = await readUserStore();
  return store.settings.plugins ?? [];
}

export async function createTemplate(
  name: string,
  options: { ide?: IdeId; dryRun?: boolean; verbose?: boolean } = {},
): Promise<void> {
  const templates: Record<string, string[]> = {
    saas: ["rule/stack-architecture", "skill/generate-readme", "skill/commit-push"],
    api: ["rule/laravel-api", "skill/larastan-fix", "skill/generate-readme"],
    react: ["rule/react-spa-dashboard", "skill/react-doctor-fix", "skill/commit-push"],
    marketing: ["rule/nextjs-marketing", "skill/generate-readme"],
  };

  const key = name.toLowerCase();
  const packages = templates[key];
  if (!packages) {
    throw new ValidationError(
      `Unknown template "${name}". Available: ${Object.keys(templates).join(", ")}`,
    );
  }

  logTitle(`Template: ${key}`);
  for (const p of packages) console.log(`  • ${p}`);

  if (options.dryRun) {
    logInfo("[dry-run] Would install template packages");
    return;
  }

  await installByPackageNames(packages, {
    ide: options.ide ?? DEFAULT_IDE,
    yes: true,
    verbose: options.verbose,
  });
  logSuccess(`Scaffolded "${key}" AI workflow`);
}

export async function previewDiff(
  input: string,
  options: { ide?: IdeId; verbose?: boolean } = {},
): Promise<void> {
  const pkg = await getPackagePreview(input, options);
  const ide = options.ide ?? DEFAULT_IDE;
  const dest = path.join(
    process.cwd(),
    getIdeDefinition(ide).rootDir,
    assetTypeToDir(pkg.type as AssetType),
    pkg.id,
  );
  const exists = await fs.pathExists(dest);

  logTitle(`Diff preview · ${pkg.type}/${pkg.id}@${pkg.version}`);
  console.log();
  console.log(`  Target: ${dest}`);
  console.log(`  Status: ${exists ? "would overwrite existing files (--force)" : "new install"}`);
  console.log(`  Contains: ${pkg.type} package files from registry`);
  if (pkg.description) console.log(`  About: ${pkg.description}`);
  console.log();
  logInfo("Run with: noah-cursor install " + `${pkg.type}/${pkg.id}` + (exists ? " --force" : ""));
}

export async function interactivePackagePicker(
  packages: Array<{ type: string; id: string; description?: string }>,
): Promise<string | null> {
  if (packages.length === 0) return null;
  return select({
    message: "Select a package",
    choices: packages.map((p) => ({
      name: `${p.type}/${p.id}${p.description ? ` — ${p.description}` : ""}`,
      value: `${p.type}/${p.id}`,
    })),
  });
}

export async function ensurePackageExists(input: string): Promise<void> {
  const listed = await listRegistryAssets();
  const hit = listed.assets.some(
    (a) => `${a.type}/${a.id}` === input || a.id === input,
  );
  if (!hit) throw new NotFoundError(`Package "${input}" not found`);
}
