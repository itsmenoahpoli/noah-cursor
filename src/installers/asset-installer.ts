import path from "node:path";
import fs from "fs-extra";
import { ConflictError, NotFoundError } from "../core/errors.js";
import { logVerbose } from "../core/logger.js";
import type { AssetType, InstallResult, Manifest } from "../types/index.js";
import {
  findAssetInManifest,
  resolveAssetPath,
  assetTypeToDir,
} from "../utils/assets.js";
import { assertAssetExists } from "../registry/validator.js";
import { resolveCursorDir } from "../utils/fs.js";

export interface InstallerOptions {
  force?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  cwd?: string;
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

  const sourceRelative = resolveAssetPath(type, id, entry.path);
  await assertAssetExists(registryPath, sourceRelative);

  const sourcePath = path.join(registryPath, sourceRelative);
  const targetDir = path.join(
    resolveCursorDir(options.cwd),
    assetTypeToDir(type),
    id,
  );

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

  return {
    type,
    id,
    version: entry.version,
    path: path.join(assetTypeToDir(type), id),
  };
}

export async function removeAssetFiles(
  type: AssetType,
  id: string,
  options: { cwd?: string; dryRun?: boolean; verbose?: boolean } = {},
): Promise<string> {
  if (type === "preset") {
    // Presets don't install files directly
    return `preset:${id}`;
  }

  const targetDir = path.join(
    resolveCursorDir(options.cwd),
    assetTypeToDir(type),
    id,
  );

  logVerbose(
    `${options.dryRun ? "[dry-run] " : ""}Remove ${targetDir}`,
    options.verbose,
  );

  if (!options.dryRun && (await fs.pathExists(targetDir))) {
    await fs.remove(targetDir);
  }

  return path.join(assetTypeToDir(type), id);
}
