import fs from "fs-extra";
import { cloneRegistry, loadLocalRegistry, type ClonedRegistry } from "../registry/cloner.js";

/**
 * Open a remote or local registry without installing anything.
 */
export async function loadRegistry(
  repository: string,
  options: { verbose?: boolean } = {},
): Promise<ClonedRegistry> {
  if (repository.startsWith("file://")) {
    return loadLocalRegistry(repository.replace(/^file:\/\//, ""));
  }

  const looksRemote =
    repository.includes("github.com") ||
    repository.startsWith("git@") ||
    repository.startsWith("http://") ||
    repository.startsWith("https://") ||
    /^[\w.-]+\/[\w.-]+$/.test(repository);

  if (!looksRemote && (await fs.pathExists(repository))) {
    return loadLocalRegistry(repository);
  }

  return cloneRegistry(repository, options);
}

export type { ClonedRegistry };
