import path from "node:path";
import fs from "fs-extra";
import { simpleGit } from "simple-git";
import { RegistryError } from "../core/errors.js";
import { logVerbose } from "../core/logger.js";
import { cleanupTempDir, createTempDir, normalizeGitHubUrl } from "../utils/fs.js";
import { readManifest, validateRegistryStructure } from "./validator.js";
import type { Manifest } from "../types/index.js";

export interface ClonedRegistry {
  path: string;
  url: string;
  manifest: Manifest;
  cleanup: () => Promise<void>;
}

export async function cloneRegistry(
  repository: string,
  options: { verbose?: boolean } = {},
): Promise<ClonedRegistry> {
  const url = normalizeGitHubUrl(repository);
  const tempDir = await createTempDir();

  logVerbose(`Cloning ${url} → ${tempDir}`, options.verbose);

  try {
    const git = simpleGit();
    await git.clone(url, tempDir, ["--depth", "1"]);
  } catch (error) {
    await cleanupTempDir(tempDir);
    throw new RegistryError(
      `Failed to clone repository: ${url.replace(/\.git$/, "")}. ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  try {
    await validateRegistryStructure(tempDir);
    const manifest = await readManifest(tempDir);

    return {
      path: tempDir,
      url: url.replace(/\.git$/, ""),
      manifest,
      cleanup: async () => cleanupTempDir(tempDir),
    };
  } catch (error) {
    await cleanupTempDir(tempDir);
    throw error;
  }
}

export async function loadLocalRegistry(registryPath: string): Promise<ClonedRegistry> {
  const resolved = path.resolve(registryPath);
  if (!(await fs.pathExists(resolved))) {
    throw new RegistryError(`Local registry path does not exist: ${resolved}`);
  }

  await validateRegistryStructure(resolved);
  const manifest = await readManifest(resolved);

  return {
    path: resolved,
    url: `file://${resolved}`,
    manifest,
    cleanup: async () => {
      // Local registries are not cleaned up
    },
  };
}
