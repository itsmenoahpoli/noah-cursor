import path from "node:path";
import fs from "fs-extra";
import {
  ASSET_DIRECTORIES,
  DEFAULT_IDE,
  METADATA_FILE,
  type IdeId,
} from "../constants/index.js";
import { MetadataError } from "../core/errors.js";
import {
  NoahMetadataSchema,
  type AssetType,
  type InstalledAsset,
  type NoahMetadata,
} from "../types/index.js";
import { resolveIdeDir } from "../utils/fs.js";

const DISK_ASSET_TYPES = ["skill", "rule", "prompt", "mcp"] as const satisfies readonly AssetType[];

export function getMetadataPath(cwd = process.cwd(), ide: IdeId = DEFAULT_IDE): string {
  return path.join(resolveIdeDir(ide, cwd), METADATA_FILE);
}

export async function readMetadata(
  cwd = process.cwd(),
  ide: IdeId = DEFAULT_IDE,
): Promise<NoahMetadata | null> {
  const metadataPath = getMetadataPath(cwd, ide);
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
  ide: IdeId = DEFAULT_IDE,
): Promise<void> {
  const targetIde = metadata.ide ?? ide;
  const metadataPath = getMetadataPath(cwd, targetIde);
  await fs.ensureDir(path.dirname(metadataPath));

  const payload: NoahMetadata = {
    ...metadata,
    ide: targetIde,
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
  ide: IdeId = DEFAULT_IDE,
): Promise<NoahMetadata> {
  const existing = (await readMetadata(cwd, ide)) ?? {
    registry,
    ide,
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
    ide,
    installed: Array.from(byKey.values()).sort((a, b) =>
      `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`),
    ),
  };

  await writeMetadata(metadata, cwd, ide);
  return metadata;
}

export async function removeInstalledAsset(
  type: string,
  id: string,
  cwd = process.cwd(),
  ide: IdeId = DEFAULT_IDE,
): Promise<NoahMetadata | null> {
  const existing = await readMetadata(cwd, ide);
  if (!existing) {
    return null;
  }

  const installed = existing.installed.filter(
    (asset) => !(asset.type === type && asset.id === id),
  );

  const metadata: NoahMetadata = {
    ...existing,
    ide,
    installed,
  };

  await writeMetadata(metadata, cwd, ide);
  return metadata;
}

export function findInstalled(
  metadata: NoahMetadata,
  type: string,
  id: string,
): InstalledAsset | undefined {
  return metadata.installed.find((asset) => asset.type === type && asset.id === id);
}

/** Scan `{ideRoot}/{skills,rules,prompts,mcp}` for asset folders on disk. */
export async function scanIdeAssets(
  cwd = process.cwd(),
  ide: IdeId = DEFAULT_IDE,
): Promise<InstalledAsset[]> {
  const ideDir = resolveIdeDir(ide, cwd);
  const results: InstalledAsset[] = [];

  for (const type of DISK_ASSET_TYPES) {
    const dirName = ASSET_DIRECTORIES[type];
    const base = path.join(ideDir, dirName);
    if (!(await fs.pathExists(base))) {
      continue;
    }

    const entries = await fs.readdir(base, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) {
        continue;
      }

      const assetDir = path.join(base, entry.name);
      const files = await fs.readdir(assetDir);
      if (files.length === 0) {
        continue;
      }

      results.push({
        type,
        id: entry.name,
        version: "local",
        path: path.join(dirName, entry.name),
      });
    }
  }

  return results;
}

/** @deprecated Use scanIdeAssets */
export async function scanCursorAssets(cwd = process.cwd()): Promise<InstalledAsset[]> {
  return scanIdeAssets(cwd, "cursor");
}

export interface ListedAssets {
  registry?: string;
  ide?: IdeId;
  updatedAt?: string;
  installed: InstalledAsset[];
}

/**
 * List installed assets by merging `{ide}/noah.json` with folders found on disk.
 */
export async function listInstalledAssets(
  cwd = process.cwd(),
  ide: IdeId = DEFAULT_IDE,
): Promise<ListedAssets> {
  const metadata = await readMetadata(cwd, ide);
  const discovered = await scanIdeAssets(cwd, ide);
  const byKey = new Map<string, InstalledAsset>();

  for (const asset of discovered) {
    byKey.set(`${asset.type}:${asset.id}`, asset);
  }

  for (const asset of metadata?.installed ?? []) {
    const key = `${asset.type}:${asset.id}`;
    const onDisk = byKey.get(key);
    byKey.set(key, {
      ...onDisk,
      ...asset,
      path: asset.path ?? onDisk?.path,
      version: asset.version || onDisk?.version || "local",
    });
  }

  const installed = Array.from(byKey.values()).sort((a, b) =>
    `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`),
  );

  return {
    registry: metadata?.registry,
    ide: metadata?.ide ?? ide,
    updatedAt: metadata?.updatedAt,
    installed,
  };
}
