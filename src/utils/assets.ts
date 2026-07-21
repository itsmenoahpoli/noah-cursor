import { ASSET_DIRECTORIES } from "../constants/index.js";
import type { AssetType, Manifest, PresetEntry } from "../types/index.js";

export function assetTypeToDir(type: AssetType): string {
  return ASSET_DIRECTORIES[type];
}

export function dirToAssetType(dir: string): AssetType | undefined {
  const entry = Object.entries(ASSET_DIRECTORIES).find(([, value]) => value === dir);
  return entry?.[0] as AssetType | undefined;
}

export function getManifestAssets(
  manifest: Manifest,
  type: Exclude<AssetType, "preset">,
): Manifest["skills"] {
  switch (type) {
    case "skill":
      return manifest.skills;
    case "rule":
      return manifest.rules;
    case "prompt":
      return manifest.prompts;
    case "mcp":
      return manifest.mcp;
  }
}

export function findAssetInManifest(
  manifest: Manifest,
  type: AssetType,
  id: string,
): Manifest["skills"][number] | PresetEntry | undefined {
  if (type === "preset") {
    return manifest.presets.find((a) => a.id === id);
  }
  return getManifestAssets(manifest, type).find((a) => a.id === id);
}

export function resolveAssetPath(
  type: AssetType,
  id: string,
  entryPath?: string,
): string {
  if (entryPath) {
    return entryPath;
  }
  return `${assetTypeToDir(type)}/${id}`;
}

export function listAllManifestAssets(manifest: Manifest): Array<{
  type: AssetType;
  id: string;
  version: string;
  description?: string;
  tags?: string[];
}> {
  const results: Array<{
    type: AssetType;
    id: string;
    version: string;
    description?: string;
    tags?: string[];
  }> = [];

  for (const type of ["skill", "rule", "prompt", "mcp"] as const) {
    for (const asset of getManifestAssets(manifest, type)) {
      results.push({
        type,
        id: asset.id,
        version: asset.version,
        description: asset.description,
        tags: asset.tags,
      });
    }
  }

  for (const preset of manifest.presets) {
    results.push({
      type: "preset",
      id: preset.id,
      version: preset.version,
      description: preset.description,
      tags: preset.tags,
    });
  }

  return results;
}
