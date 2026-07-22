import { confirm } from "@inquirer/prompts";
import { NotFoundError, ValidationError } from "../core/errors.js";
import { logInfo, logSuccess, logVerbose, logWarn } from "../core/logger.js";
import { installAsset, removeAssetFiles } from "../installers/asset-installer.js";
import {
  findInstalled,
  readMetadata,
  removeInstalledAsset,
  upsertInstalledAssets,
} from "../metadata/store.js";
import type { ClonedRegistry } from "../registry/cloner.js";
import { loadRegistry } from "./registry-loader.js";
import type {
  AddOptions,
  AssetRequest,
  AssetType,
  InstallResult,
  Manifest,
  PresetEntry,
  SearchResult,
} from "../types/index.js";
import {
  findAssetInManifest,
  getManifestAssets,
  listAllManifestAssets,
} from "../utils/assets.js";
import { pluralize } from "../utils/fs.js";
import {
  preferLocalRegistry,
  resolveNoahRegistry,
  toPublicRegistryLabel,
  toStoredRegistryUrl,
} from "../utils/registry.js";

function collectRequests(options: AddOptions): AssetRequest[] {
  const requests: AssetRequest[] = [];

  if (options.skill) requests.push({ type: "skill", id: options.skill });
  if (options.rule) requests.push({ type: "rule", id: options.rule });
  if (options.prompt) requests.push({ type: "prompt", id: options.prompt });
  if (options.mcp) requests.push({ type: "mcp", id: options.mcp });
  if (options.preset) requests.push({ type: "preset", id: options.preset });

  return requests;
}

export function expandPreset(manifest: Manifest, presetId: string): AssetRequest[] {
  const preset = findAssetInManifest(manifest, "preset", presetId) as
    | PresetEntry
    | undefined;

  if (!preset) {
    throw new NotFoundError(`Preset "${presetId}" not found in registry manifest`);
  }

  const requests: AssetRequest[] = [];
  const includes = preset.includes ?? {};

  for (const id of includes.skills ?? []) {
    requests.push({ type: "skill", id });
  }
  for (const id of includes.rules ?? []) {
    requests.push({ type: "rule", id });
  }
  for (const id of includes.prompts ?? []) {
    requests.push({ type: "prompt", id });
  }
  for (const id of includes.mcp ?? []) {
    requests.push({ type: "mcp", id });
  }

  if (requests.length === 0) {
    throw new ValidationError(`Preset "${presetId}" does not include any assets`);
  }

  return requests;
}

function resolveInstallTargets(
  manifest: Manifest,
  options: AddOptions,
): { requests: AssetRequest[]; presets: string[] } {
  if (options.all) {
    const requests: AssetRequest[] = [];
    for (const type of ["skill", "rule", "prompt", "mcp"] as const) {
      for (const asset of getManifestAssets(manifest, type)) {
        requests.push({ type, id: asset.id });
      }
    }
    return { requests, presets: manifest.presets.map((p) => p.id) };
  }

  const collected = collectRequests(options);
  if (collected.length === 0) {
    throw new ValidationError(
      "Specify at least one asset with --skill, --rule, --prompt, --mcp, --preset, or use --all",
    );
  }

  const requests: AssetRequest[] = [];
  const presets: string[] = [];
  const seen = new Set<string>();

  for (const request of collected) {
    if (request.type === "preset") {
      presets.push(request.id);
      for (const expanded of expandPreset(manifest, request.id)) {
        const key = `${expanded.type}:${expanded.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          requests.push(expanded);
        }
      }
    } else {
      const key = `${request.type}:${request.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        requests.push(request);
      }
    }
  }

  return { requests, presets };
}

export interface InstallSelectionsOptions {
  force?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  onStepStart?: (message: string) => void | Promise<void>;
  onStepDone?: (message: string) => void | Promise<void>;
}

/**
 * Install previously selected assets from an already-loaded registry.
 * Does not clean up the registry — caller owns lifecycle.
 */
export async function installFromSelections(
  registry: ClonedRegistry,
  selections: AssetRequest[],
  options: InstallSelectionsOptions = {},
): Promise<InstallResult[]> {
  if (selections.length === 0) {
    throw new ValidationError("No assets selected for installation");
  }

  const requests: AssetRequest[] = [];
  const presets: string[] = [];
  const seen = new Set<string>();

  for (const selection of selections) {
    if (selection.type === "preset") {
      presets.push(selection.id);
      for (const expanded of expandPreset(registry.manifest, selection.id)) {
        const key = `${expanded.type}:${expanded.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          requests.push(expanded);
        }
      }
    } else {
      const key = `${selection.type}:${selection.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        requests.push(selection);
      }
    }
  }

  const results: InstallResult[] = [];
  const installedMeta = [];

  for (const request of requests) {
    const step = `Installing ${request.type}/${request.id}`;
    await options.onStepStart?.(step);
    const result = await installAsset(
      registry.path,
      registry.manifest,
      request.type,
      request.id,
      {
        force: options.force,
        dryRun: options.dryRun,
        verbose: options.verbose,
      },
    );
    await options.onStepDone?.(step);
    results.push(result);

    if (!result.skipped) {
      installedMeta.push({
        type: result.type,
        id: result.id,
        version: result.version,
        path: result.path,
        installedAt: new Date().toISOString(),
      });
    } else {
      logWarn(`Skipped ${result.type}/${result.id}: ${result.reason}`);
    }
  }

  for (const presetId of presets) {
    const preset = findAssetInManifest(registry.manifest, "preset", presetId);
    if (preset && !options.dryRun) {
      installedMeta.push({
        type: "preset" as const,
        id: presetId,
        version: preset.version,
        installedAt: new Date().toISOString(),
      });
    }
  }

  if (!options.dryRun && installedMeta.length > 0) {
    await options.onStepStart?.("Updating noah.json");
    await upsertInstalledAssets(toStoredRegistryUrl(registry.url), installedMeta);
    await options.onStepDone?.("Updating noah.json");
  }

  return results;
}

export async function addFromRegistry(
  repository: string | undefined,
  options: AddOptions,
): Promise<InstallResult[]> {
  const source = resolveNoahRegistry(repository);
  const registry = await loadRegistry(source, { verbose: options.verbose });

  try {
    const { requests, presets } = resolveInstallTargets(registry.manifest, options);

    logVerbose(
      `Resolved ${requests.length} ${pluralize(requests.length, "asset")} ` +
        `(${presets.length} ${pluralize(presets.length, "preset")})`,
      options.verbose,
    );

    if (!options.yes && !options.dryRun && requests.length > 5) {
      const ok = await confirm({
        message: `Install ${requests.length} assets from ${toPublicRegistryLabel()}?`,
        default: true,
      });
      if (!ok) {
        logWarn("Installation cancelled.");
        return [];
      }
    }

    const selections: AssetRequest[] = [
      ...requests,
      ...presets.map((id) => ({ type: "preset" as const, id })),
    ];

    const results = await installFromSelections(registry, selections, {
      force: options.force,
      dryRun: options.dryRun,
      verbose: options.verbose,
    });

    const installed = results.filter((r) => !r.skipped);
    if (options.dryRun) {
      logInfo(
        `[dry-run] Would install ${installed.length} ${pluralize(installed.length, "asset")}`,
      );
    } else {
      logSuccess(
        `Installed ${installed.length} ${pluralize(installed.length, "asset")} ` +
          `from ${toPublicRegistryLabel()}`,
      );
    }

    return results;
  } finally {
    await registry.cleanup();
  }
}

export async function searchRegistry(
  query: string,
  repository?: string,
  options: { verbose?: boolean } = {},
): Promise<SearchResult[]> {
  const source = resolveNoahRegistry(repository);
  const registry = await loadRegistry(source, options);

  try {
    const needle = query.toLowerCase();
    return listAllManifestAssets(registry.manifest).filter((asset) => {
      const haystack = [
        asset.id,
        asset.description ?? "",
        ...(asset.tags ?? []),
        asset.type,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  } finally {
    await registry.cleanup();
  }
}

export async function listRegistryAssets(
  repository?: string,
  options: { verbose?: boolean } = {},
): Promise<{
  registry: string;
  name: string;
  version: string;
  assets: SearchResult[];
}> {
  const source = resolveNoahRegistry(repository ?? (await preferLocalRegistry()));
  const registry = await loadRegistry(source, options);

  try {
    return {
      registry: toPublicRegistryLabel(),
      name: registry.manifest.name,
      version: registry.manifest.version,
      assets: listAllManifestAssets(registry.manifest),
    };
  } finally {
    await registry.cleanup();
  }
}

export async function removeAsset(
  type: AssetType,
  id: string,
  options: { force?: boolean; yes?: boolean; dryRun?: boolean; verbose?: boolean } = {},
): Promise<void> {
  const metadata = await readMetadata();
  if (!metadata) {
    throw new NotFoundError("No installed assets found (.cursor/noah.json missing)");
  }

  const installed = findInstalled(metadata, type, id);
  if (!installed && !options.force) {
    throw new NotFoundError(`${type} "${id}" is not recorded in .cursor/noah.json`);
  }

  if (!options.yes && !options.dryRun) {
    const ok = await confirm({
      message: `Remove ${type}/${id}?`,
      default: false,
    });
    if (!ok) {
      logWarn("Removal cancelled.");
      return;
    }
  }

  await removeAssetFiles(type, id, options);

  if (!options.dryRun) {
    await removeInstalledAsset(type, id);
    logSuccess(`Removed ${type}/${id}`);
  } else {
    logInfo(`[dry-run] Would remove ${type}/${id}`);
  }
}

export async function updateAssets(
  options: { force?: boolean; yes?: boolean; verbose?: boolean; dryRun?: boolean } = {},
): Promise<InstallResult[]> {
  const metadata = await readMetadata();
  if (!metadata || metadata.installed.length === 0) {
    throw new NotFoundError("No installed assets to update");
  }

  const nonPresets = metadata.installed.filter((a) => a.type !== "preset");
  const presets = metadata.installed.filter((a) => a.type === "preset");

  if (!options.yes && !options.dryRun) {
    const ok = await confirm({
      message: `Update ${nonPresets.length} ${pluralize(nonPresets.length, "asset")} from ${toPublicRegistryLabel()}?`,
      default: true,
    });
    if (!ok) {
      logWarn("Update cancelled.");
      return [];
    }
  }

  const source = resolveNoahRegistry(toStoredRegistryUrl(metadata.registry));
  const registry = await loadRegistry(source, { verbose: options.verbose });

  try {
    const selections: AssetRequest[] = [
      ...nonPresets.map((a) => ({ type: a.type, id: a.id })),
      ...presets.map((a) => ({ type: "preset" as const, id: a.id })),
    ];

    const results = await installFromSelections(registry, selections, {
      force: true,
      dryRun: options.dryRun,
      verbose: options.verbose,
    });

    logSuccess(
      options.dryRun
        ? `[dry-run] Would update ${results.length} ${pluralize(results.length, "asset")}`
        : `Updated ${results.length} ${pluralize(results.length, "asset")}`,
    );

    return results;
  } finally {
    await registry.cleanup();
  }
}
