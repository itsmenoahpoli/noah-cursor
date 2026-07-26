import { confirm } from "@inquirer/prompts";
import { NotFoundError, ValidationError } from "../core/errors.js";
import { logInfo, logSuccess, logVerbose, logWarn } from "../core/logger.js";
import {
  BUNDLED_REGISTRY,
  DEFAULT_IDE,
  getIdeDefinition,
  METADATA_FILE,
  type IdeId,
} from "../constants/index.js";
import { installAsset, removeAssetFiles } from "../installers/asset-installer.js";
import {
  findInstalled,
  listInstalledAssets,
  readMetadata,
  removeInstalledAsset,
  upsertInstalledAssets,
} from "../metadata/store.js";
import { addRecent, appendAudit, pushUndo } from "../metadata/user-store.js";
import type { ClonedRegistry } from "../registry/cloner.js";
import { loadRegistry } from "./registry-loader.js";
import { syncLockfileFromInstalled } from "./lockfile-service.js";
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
import { fuzzyFilter } from "../utils/fuzzy.js";
import { parsePackageRef, versionMatches } from "../utils/semver.js";
import { pluralize } from "../utils/fs.js";
import {
  isOfficialRegistryUrl,
  preferLocalRegistry,
  resolveNoahRegistry,
  toPublicRegistryLabel,
  toStoredRegistryUrl,
} from "../utils/registry.js";
import { ASSET_TYPES } from "../constants/index.js";
import { assertSafeAssetId } from "../utils/paths.js";

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
  ide?: IdeId;
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
        ide: options.ide,
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
    await upsertInstalledAssets(
      toStoredRegistryUrl(registry.url),
      installedMeta,
      process.cwd(),
      options.ide,
    );
    await options.onStepDone?.("Updating noah.json");

    const ide = options.ide ?? DEFAULT_IDE;
    for (const meta of installedMeta) {
      await addRecent(meta.type, meta.id, "installed");
      await pushUndo({
        action: "install",
        type: meta.type,
        id: meta.id,
        ide,
        at: new Date().toISOString(),
      });
      await appendAudit("install", `${meta.type}/${meta.id}@${meta.version}`);
    }

    const listed = await listInstalledAssets(process.cwd(), ide);
    await syncLockfileFromInstalled(listed.installed, ide);
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
      ide: options.ide,
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
  options: { verbose?: boolean; tag?: string; type?: AssetType } = {},
): Promise<SearchResult[]> {
  const source = resolveNoahRegistry(repository);
  const registry = await loadRegistry(source, options);

  try {
    let assets = listAllManifestAssets(registry.manifest);
    if (options.type) {
      assets = assets.filter((a) => a.type === options.type);
    }
    if (options.tag) {
      const tag = options.tag.toLowerCase();
      assets = assets.filter((a) => (a.tags ?? []).some((t) => t.toLowerCase() === tag));
    }
    return fuzzyFilter(assets, query, (asset) => [
      asset.id,
      asset.description ?? "",
      ...(asset.tags ?? []),
      asset.type,
    ]);
  } finally {
    await registry.cleanup();
  }
}

/** Resolve a package ref like `laravel-api`, `rule/laravel-api`, or `laravel-api@1.0.0`. */
export async function resolvePackageRequest(
  input: string,
  repository?: string,
  options: { verbose?: boolean } = {},
): Promise<AssetRequest> {
  const ref = parsePackageRef(input);
  const source = resolveNoahRegistry(repository);
  const registry = await loadRegistry(source, options);

  try {
    const assets = listAllManifestAssets(registry.manifest);

    if (ref.type) {
      if (!ASSET_TYPES.includes(ref.type as AssetType)) {
        throw new ValidationError(
          `Invalid asset type "${ref.type}". Expected one of: ${ASSET_TYPES.join(", ")}`,
        );
      }
      const found = findAssetInManifest(registry.manifest, ref.type as AssetType, ref.id);
      if (!found) {
        throw new NotFoundError(`${ref.type}/${ref.id} not found in registry`);
      }
      if (ref.version && !versionMatches(found.version, ref.version)) {
        throw new NotFoundError(
          `${ref.type}/${ref.id}@${ref.version} not found (available: ${found.version})`,
        );
      }
      return { type: ref.type as AssetType, id: ref.id, version: found.version };
    }

    const exact = assets.filter((a) => a.id === ref.id);
    if (exact.length === 1) {
      const asset = exact[0]!;
      if (ref.version && !versionMatches(asset.version, ref.version)) {
        throw new NotFoundError(
          `${asset.id}@${ref.version} not found (available: ${asset.version})`,
        );
      }
      return { type: asset.type, id: asset.id, version: asset.version };
    }
    if (exact.length > 1) {
      throw new ValidationError(
        `Ambiguous package "${ref.id}". Specify type: ${exact.map((a) => `${a.type}/${a.id}`).join(", ")}`,
      );
    }

    const fuzzy = fuzzyFilter(assets, ref.id, (a) => [a.id, ...(a.tags ?? [])], 5);
    if (fuzzy.length === 1) {
      const asset = fuzzy[0]!;
      return { type: asset.type, id: asset.id, version: asset.version };
    }
    if (fuzzy.length > 1) {
      throw new ValidationError(
        `Ambiguous package "${ref.id}". Did you mean: ${fuzzy.map((a) => `${a.type}/${a.id}`).join(", ")}?`,
      );
    }

    throw new NotFoundError(`Package "${input}" not found in registry`);
  } finally {
    await registry.cleanup();
  }
}

/** Expand dependsOn strings (`type/id` or bare id) into AssetRequests. */
export function expandDependencies(
  manifest: Manifest,
  requests: AssetRequest[],
): AssetRequest[] {
  const resolved: AssetRequest[] = [];
  const seen = new Set<string>();

  const visit = (request: AssetRequest) => {
    const key = `${request.type}:${request.id}`;
    if (seen.has(key)) return;
    seen.add(key);

    const entry = findAssetInManifest(manifest, request.type, request.id);
    for (const dep of entry?.dependsOn ?? []) {
      const ref = parsePackageRef(dep);
      if (ref.type && ASSET_TYPES.includes(ref.type as AssetType)) {
        visit({ type: ref.type as AssetType, id: ref.id });
      } else {
        const matches = listAllManifestAssets(manifest).filter((a) => a.id === ref.id);
        if (matches[0]) {
          visit({ type: matches[0].type, id: matches[0].id });
        }
      }
    }

    resolved.push(request);
  };

  for (const request of requests) visit(request);
  return resolved;
}

export async function installByPackageNames(
  packages: string[],
  options: AddOptions = {},
): Promise<InstallResult[]> {
  if (packages.length === 0) {
    throw new ValidationError("Specify at least one package to install");
  }

  const source = resolveNoahRegistry(undefined);
  const registry = await loadRegistry(source, { verbose: options.verbose });

  try {
    const requests: AssetRequest[] = [];
    for (const pkg of packages) {
      const resolved = await resolvePackageRequest(pkg, undefined, { verbose: options.verbose });
      requests.push(resolved);
    }

    const withDeps = expandDependencies(registry.manifest, requests);

    if (!options.yes && !options.dryRun && withDeps.length > 5) {
      const ok = await confirm({
        message: `Install ${withDeps.length} assets from ${toPublicRegistryLabel()}?`,
        default: true,
      });
      if (!ok) {
        logWarn("Installation cancelled.");
        return [];
      }
    }

    const results = await installFromSelections(registry, withDeps, {
      force: options.force,
      dryRun: options.dryRun,
      verbose: options.verbose,
      ide: options.ide,
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

export async function getPackagePreview(
  input: string,
  options: { verbose?: boolean } = {},
): Promise<SearchResult> {
  const request = await resolvePackageRequest(input, undefined, options);
  await addRecent(request.type, request.id, "viewed");
  const listed = await listRegistryAssets(undefined, options);
  const found = listed.assets.find((a) => a.type === request.type && a.id === request.id);
  if (!found) {
    throw new NotFoundError(`Package "${input}" not found`);
  }
  return found;
}

export async function listRegistryAssets(
  repository?: string,
  options: { verbose?: boolean } = {},
): Promise<{
  registry: string;
  name: string;
  version: string;
  assets: SearchResult[];
  local?: boolean;
}> {
  const preferredLocal = repository ?? (await preferLocalRegistry());
  const source = resolveNoahRegistry(preferredLocal);
  const registry = await loadRegistry(source, options);
  const usingLocal =
    source !== BUNDLED_REGISTRY &&
    !isOfficialRegistryUrl(source) &&
    !source.includes("github.com") &&
    !source.startsWith("git@");

  try {
    return {
      registry: usingLocal
        ? "Local registry (development checkout)"
        : toPublicRegistryLabel(),
      name: registry.manifest.name,
      version: registry.manifest.version,
      assets: listAllManifestAssets(registry.manifest),
      local: usingLocal,
    };
  } finally {
    await registry.cleanup();
  }
}

export async function removeAsset(
  type: AssetType,
  id: string,
  options: {
    force?: boolean;
    yes?: boolean;
    dryRun?: boolean;
    verbose?: boolean;
    ide?: IdeId;
  } = {},
): Promise<void> {
  const safeId = assertSafeAssetId(id);
  const ide = options.ide ?? DEFAULT_IDE;
  const ideRoot = getIdeDefinition(ide).rootDir;
  const metadata = await readMetadata(process.cwd(), ide);
  if (!metadata) {
    throw new NotFoundError(`No installed assets found (${ideRoot}/${METADATA_FILE} missing)`);
  }

  const installed = findInstalled(metadata, type, safeId);
  if (!installed && !options.force) {
    throw new NotFoundError(
      `${type} "${safeId}" is not recorded in ${ideRoot}/${METADATA_FILE}`,
    );
  }

  if (!options.yes && !options.dryRun) {
    const ok = await confirm({
      message: `Remove ${type}/${safeId}?`,
      default: false,
    });
    if (!ok) {
      logWarn("Removal cancelled.");
      return;
    }
  }

  await removeAssetFiles(type, safeId, { ...options, ide });

  if (!options.dryRun) {
    await removeInstalledAsset(type, safeId, process.cwd(), ide);
    await pushUndo({
      action: "uninstall",
      type,
      id: safeId,
      ide,
      at: new Date().toISOString(),
    });
    await appendAudit("uninstall", `${type}/${safeId}`);
    const listed = await listInstalledAssets(process.cwd(), ide);
    await syncLockfileFromInstalled(listed.installed, ide);
    logSuccess(`Removed ${type}/${safeId}`);
  } else {
    logInfo(`[dry-run] Would remove ${type}/${safeId}`);
  }
}

export async function updateAssets(
  options: {
    force?: boolean;
    yes?: boolean;
    verbose?: boolean;
    dryRun?: boolean;
    ide?: IdeId;
  } = {},
): Promise<InstallResult[]> {
  const ide = options.ide ?? DEFAULT_IDE;
  const metadata = await readMetadata(process.cwd(), ide);
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
      ide,
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
