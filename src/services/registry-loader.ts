import fs from "fs-extra";
import { BUNDLED_REGISTRY, OFFICIAL_REGISTRY } from "../constants/index.js";
import { cloneRegistry, loadLocalRegistry, type ClonedRegistry } from "../registry/cloner.js";
import {
  getBundledRegistryPath,
  isOfficialRegistryUrl,
  resolveNoahRegistry,
} from "../utils/registry.js";

/**
 * Load the registry embedded in this package at build time.
 * Reported URL is the official registry for metadata/display.
 */
export async function loadBundledRegistry(): Promise<ClonedRegistry> {
  const registry = await loadLocalRegistry(getBundledRegistryPath());
  return {
    ...registry,
    url: OFFICIAL_REGISTRY,
  };
}

/**
 * Open a bundled, local, or (legacy) remote registry without installing anything.
 * Official / empty sources resolve to the build-time bundled registry — no git clone.
 */
export async function loadRegistry(
  repository: string,
  options: { verbose?: boolean } = {},
): Promise<ClonedRegistry> {
  const source = resolveNoahRegistry(repository);

  if (source === BUNDLED_REGISTRY || isOfficialRegistryUrl(source)) {
    return loadBundledRegistry();
  }

  if (source.startsWith("file://")) {
    return loadLocalRegistry(source.replace(/^file:\/\//, ""));
  }

  const looksRemote =
    source.includes("github.com") ||
    source.startsWith("git@") ||
    source.startsWith("http://") ||
    source.startsWith("https://") ||
    /^[\w.-]+\/[\w.-]+$/.test(source);

  if (!looksRemote && (await fs.pathExists(source))) {
    return loadLocalRegistry(source);
  }

  // Unreachable for official remotes (resolved to bundled); kept for unexpected URLs
  return cloneRegistry(source, options);
}

export type { ClonedRegistry };
