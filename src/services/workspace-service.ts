import path from "node:path";
import fs from "fs-extra";
import { DEFAULT_IDE, WORKSPACE_FILE, type IdeId } from "../constants/index.js";
import { ValidationError } from "../core/errors.js";
import { logInfo, logSuccess } from "../core/logger.js";
import {
  WorkspaceConfigSchema,
  type InstallResult,
  type WorkspaceConfig,
} from "../types/index.js";
import { analyzeProject, recommendPackages } from "./project-awareness.js";
import { installByPackageNames } from "./install-service.js";
import { appendAudit } from "../metadata/user-store.js";

export function getWorkspacePath(cwd = process.cwd()): string {
  return path.join(cwd, WORKSPACE_FILE);
}

export async function readWorkspace(cwd = process.cwd()): Promise<WorkspaceConfig | null> {
  const filePath = getWorkspacePath(cwd);
  if (!(await fs.pathExists(filePath))) return null;
  try {
    return WorkspaceConfigSchema.parse(await fs.readJson(filePath));
  } catch (error) {
    throw new ValidationError(`Invalid ${WORKSPACE_FILE}: ${String(error)}`);
  }
}

export async function writeWorkspace(
  config: WorkspaceConfig,
  cwd = process.cwd(),
): Promise<WorkspaceConfig> {
  const parsed = WorkspaceConfigSchema.parse(config);
  await fs.writeJson(getWorkspacePath(cwd), parsed, { spaces: 2 });
  return parsed;
}

export async function initWorkspace(
  options: { ide?: IdeId; packages?: string[]; registry?: string } = {},
  cwd = process.cwd(),
): Promise<WorkspaceConfig> {
  const existing = await readWorkspace(cwd);
  const config: WorkspaceConfig = {
    packages: options.packages ?? existing?.packages ?? [],
    ide: options.ide ?? existing?.ide ?? DEFAULT_IDE,
    registry: options.registry ?? existing?.registry,
    settings: existing?.settings ?? {},
  };
  const written = await writeWorkspace(config, cwd);
  logSuccess(`Wrote ${WORKSPACE_FILE}`);
  return written;
}

export async function syncWorkspace(
  options: { yes?: boolean; dryRun?: boolean; verbose?: boolean; force?: boolean } = {},
  cwd = process.cwd(),
): Promise<InstallResult[]> {
  const config = await readWorkspace(cwd);
  if (!config || config.packages.length === 0) {
    throw new ValidationError(
      `No packages in ${WORKSPACE_FILE}. Run \`noah-cursor workspace init\` or \`noah-cursor bootstrap\` first.`,
    );
  }

  logInfo(`Syncing ${config.packages.length} package(s) from ${WORKSPACE_FILE}`);
  await appendAudit("sync", config.packages.join(", "));
  return installByPackageNames(config.packages, {
    ide: config.ide,
    yes: options.yes,
    dryRun: options.dryRun,
    verbose: options.verbose,
    force: options.force ?? true,
  });
}

export interface BootstrapPlan {
  analysis: Awaited<ReturnType<typeof analyzeProject>>;
  packages: string[];
  ide: IdeId;
}

/** Analyse the project and return recommended packages (no install). */
export async function planBootstrap(
  options: { verbose?: boolean; ide?: IdeId; all?: boolean } = {},
  cwd = process.cwd(),
): Promise<BootstrapPlan> {
  const ide = options.ide ?? DEFAULT_IDE;
  const analysis = await analyzeProject(cwd, ide, { verbose: options.verbose });
  const recommended = analysis.recommendations.map((r) => `${r.type}/${r.id}`);
  const packages =
    !options.all && recommended.length > 5 ? recommended.slice(0, 5) : recommended;
  return { analysis, packages, ide };
}

/** Write workspace config and install planned packages. */
export async function applyBootstrap(
  plan: BootstrapPlan,
  options: { yes?: boolean; dryRun?: boolean; verbose?: boolean } = {},
  cwd = process.cwd(),
): Promise<InstallResult[]> {
  if (plan.packages.length === 0) {
    logInfo("No recommended packages to install.");
    return [];
  }

  await initWorkspace({ ide: plan.ide, packages: plan.packages }, cwd);
  await appendAudit("bootstrap", plan.packages.join(", "));

  return installByPackageNames(plan.packages, {
    ide: plan.ide,
    yes: options.yes ?? true,
    dryRun: options.dryRun,
    verbose: options.verbose,
    force: false,
  });
}

export async function bootstrapProject(
  options: {
    yes?: boolean;
    dryRun?: boolean;
    verbose?: boolean;
    ide?: IdeId;
    all?: boolean;
    /** When false, skip install (caller already confirmed or user declined). */
    install?: boolean;
  } = {},
  cwd = process.cwd(),
): Promise<{
  analysis: Awaited<ReturnType<typeof analyzeProject>>;
  packages: string[];
  results: InstallResult[];
}> {
  const plan = await planBootstrap(options, cwd);
  if (options.install === false) {
    return { analysis: plan.analysis, packages: plan.packages, results: [] };
  }
  const results = await applyBootstrap(plan, options, cwd);
  return { analysis: plan.analysis, packages: plan.packages, results };
}

export async function suggestWorkspacePackages(cwd = process.cwd()): Promise<string[]> {
  const recs = await recommendPackages(cwd);
  return recs.map((r) => `${r.type}/${r.id}`);
}
