import path from "node:path";
import fs from "fs-extra";
import { ConflictError, NotFoundError } from "../core/errors.js";
import { logVerbose } from "../core/logger.js";
import { DEFAULT_IDE, type IdeId } from "../constants/index.js";
import type { AssetType, InstallResult, Manifest } from "../types/index.js";
import {
  findAssetInManifest,
  resolveAssetPath,
  assetTypeToDir,
} from "../utils/assets.js";
import { assertAssetExists } from "../registry/validator.js";
import { resolveIdeDir } from "../utils/fs.js";
import {
  assertPathInside,
  assertSafeAssetId,
  assertSafeRelativePath,
} from "../utils/paths.js";

export interface InstallerOptions {
  force?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  cwd?: string;
  ide?: IdeId;
}

function resolveInstallPaths(
  registryPath: string,
  type: AssetType,
  id: string,
  entryPath: string | undefined,
  options: InstallerOptions,
): { sourcePath: string; targetDir: string; sourceRelative: string } {
  const safeId = assertSafeAssetId(id);
  const sourceRelative = assertSafeRelativePath(
    resolveAssetPath(type, safeId, entryPath),
  );
  const ide = options.ide ?? DEFAULT_IDE;
  const cwd = options.cwd ?? process.cwd();
  const ideRoot = resolveIdeDir(ide, cwd);
  const typeRoot = path.join(ideRoot, assetTypeToDir(type));

  const sourcePath = assertPathInside(
    registryPath,
    path.join(registryPath, sourceRelative),
    "Asset source",
  );
  const targetDir = assertPathInside(
    typeRoot,
    path.join(typeRoot, safeId),
    "Asset install target",
  );

  return { sourcePath, targetDir, sourceRelative };
}

export async function installAsset(
  registryPath: string,
  manifest: Manifest,
  type: AssetType,
  id: string,
  options: InstallerOptions = {},
): Promise<InstallResult> {
  const entry = findAssetInManifest(manifest, type, id);
  if (!entry) {
    throw new NotFoundError(`${type} "${id}" not found in registry manifest`);
  }

  if (type === "preset") {
    throw new ConflictError(
      `Preset "${id}" must be expanded before installation. Use the install service.`,
    );
  }

  const { sourcePath, targetDir, sourceRelative } = resolveInstallPaths(
    registryPath,
    type,
    id,
    entry.path,
    options,
  );
  await assertAssetExists(registryPath, sourceRelative);

  if ((await fs.pathExists(targetDir)) && !options.force) {
    return {
      type,
      id,
      version: entry.version,
      path: path.relative(options.cwd ?? process.cwd(), targetDir),
      skipped: true,
      reason: "already exists (use --force to overwrite)",
    };
  }

  logVerbose(
    `${options.dryRun ? "[dry-run] " : ""}Install ${type}/${id}: ${sourcePath} → ${targetDir}`,
    options.verbose,
  );

  if (!options.dryRun) {
    await fs.ensureDir(path.dirname(targetDir));
    await fs.remove(targetDir);
    await fs.copy(sourcePath, targetDir);
  }

  const safeId = assertSafeAssetId(id);
  return {
    type,
    id: safeId,
    version: entry.version,
    path: path.join(assetTypeToDir(type), safeId),
  };
}

export async function removeAssetFiles(
  type: AssetType,
  id: string,
  options: { cwd?: string; dryRun?: boolean; verbose?: boolean; ide?: IdeId } = {},
): Promise<string> {
  if (type === "preset") {
    // Presets don't install files directly
    return `preset:${id}`;
  }

  const safeId = assertSafeAssetId(id);
  const ide = options.ide ?? DEFAULT_IDE;
  const cwd = options.cwd ?? process.cwd();
  const ideRoot = resolveIdeDir(ide, cwd);
  const typeRoot = path.join(ideRoot, assetTypeToDir(type));
  const targetDir = assertPathInside(
    typeRoot,
    path.join(typeRoot, safeId),
    "Asset remove target",
  );

  logVerbose(
    `${options.dryRun ? "[dry-run] " : ""}Remove ${targetDir}`,
    options.verbose,
  );

  if (!options.dryRun && (await fs.pathExists(targetDir))) {
    await fs.remove(targetDir);
  }

  return path.join(assetTypeToDir(type), safeId);
}
