import path from "node:path";
import fs from "fs-extra";
import { CURSOR_DIR, METADATA_FILE } from "../constants/index.js";
import { MetadataError } from "../core/errors.js";
import {
  NoahMetadataSchema,
  type InstalledAsset,
  type NoahMetadata,
} from "../types/index.js";
import { resolveProjectRoot } from "../utils/fs.js";

export function getMetadataPath(cwd = process.cwd()): string {
  return path.join(resolveProjectRoot(cwd), CURSOR_DIR, METADATA_FILE);
}

export async function readMetadata(cwd = process.cwd()): Promise<NoahMetadata | null> {
  const metadataPath = getMetadataPath(cwd);
  if (!(await fs.pathExists(metadataPath))) {
    return null;
  }

  try {
    const raw = await fs.readJson(metadataPath);
    const parsed = NoahMetadataSchema.safeParse(raw);
    if (!parsed.success) {
      throw new MetadataError(`Invalid ${METADATA_FILE}`, parsed.error.flatten());
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof MetadataError) {
      throw error;
    }
    throw new MetadataError(`Failed to read ${METADATA_FILE}: ${String(error)}`);
  }
}

export async function writeMetadata(
  metadata: NoahMetadata,
  cwd = process.cwd(),
): Promise<void> {
  const metadataPath = getMetadataPath(cwd);
  await fs.ensureDir(path.dirname(metadataPath));

  const payload: NoahMetadata = {
    ...metadata,
    updatedAt: new Date().toISOString(),
  };

  const parsed = NoahMetadataSchema.safeParse(payload);
  if (!parsed.success) {
    throw new MetadataError(`Invalid metadata payload`, parsed.error.flatten());
  }

  await fs.writeJson(metadataPath, parsed.data, { spaces: 2 });
}

export async function upsertInstalledAssets(
  registry: string,
  assets: InstalledAsset[],
  cwd = process.cwd(),
): Promise<NoahMetadata> {
  const existing = (await readMetadata(cwd)) ?? {
    registry,
    installed: [],
  };

  const byKey = new Map(
    existing.installed.map((asset) => [`${asset.type}:${asset.id}`, asset]),
  );

  for (const asset of assets) {
    byKey.set(`${asset.type}:${asset.id}`, {
      ...asset,
      installedAt: asset.installedAt ?? new Date().toISOString(),
    });
  }

  const metadata: NoahMetadata = {
    registry,
    installed: Array.from(byKey.values()).sort((a, b) =>
      `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`),
    ),
  };

  await writeMetadata(metadata, cwd);
  return metadata;
}

export async function removeInstalledAsset(
  type: string,
  id: string,
  cwd = process.cwd(),
): Promise<NoahMetadata | null> {
  const existing = await readMetadata(cwd);
  if (!existing) {
    return null;
  }

  const installed = existing.installed.filter(
    (asset) => !(asset.type === type && asset.id === id),
  );

  const metadata: NoahMetadata = {
    ...existing,
    installed,
  };

  await writeMetadata(metadata, cwd);
  return metadata;
}

export function findInstalled(
  metadata: NoahMetadata,
  type: string,
  id: string,
): InstalledAsset | undefined {
  return metadata.installed.find((asset) => asset.type === type && asset.id === id);
}
