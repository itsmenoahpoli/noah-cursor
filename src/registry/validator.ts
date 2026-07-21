import path from "node:path";
import fs from "fs-extra";
import { MANIFEST_FILE, REGISTRY_REQUIRED_DIRS } from "../constants/index.js";
import { RegistryError, ValidationError } from "../core/errors.js";
import { ManifestSchema, type Manifest } from "../types/index.js";

export async function readManifest(registryPath: string): Promise<Manifest> {
  const manifestPath = path.join(registryPath, MANIFEST_FILE);

  if (!(await fs.pathExists(manifestPath))) {
    throw new RegistryError(
      `Registry is missing ${MANIFEST_FILE}. Expected it at the repository root.`,
    );
  }

  let raw: unknown;
  try {
    raw = await fs.readJson(manifestPath);
  } catch (error) {
    throw new RegistryError(`Failed to parse ${MANIFEST_FILE}: ${String(error)}`);
  }

  const parsed = ManifestSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(`Invalid ${MANIFEST_FILE}`, parsed.error.flatten());
  }

  return parsed.data;
}

export async function validateRegistryStructure(registryPath: string): Promise<void> {
  if (!(await fs.pathExists(registryPath))) {
    throw new RegistryError(`Registry path does not exist: ${registryPath}`);
  }

  const missing: string[] = [];
  for (const dir of REGISTRY_REQUIRED_DIRS) {
    const dirPath = path.join(registryPath, dir);
    if (!(await fs.pathExists(dirPath))) {
      missing.push(dir);
    }
  }

  if (missing.length > 0) {
    throw new RegistryError(
      `Registry is missing required directories: ${missing.join(", ")}. ` +
        `Expected: ${REGISTRY_REQUIRED_DIRS.join(", ")}.`,
    );
  }

  await readManifest(registryPath);
}

export async function assertAssetExists(
  registryPath: string,
  relativePath: string,
): Promise<void> {
  const fullPath = path.join(registryPath, relativePath);
  if (!(await fs.pathExists(fullPath))) {
    throw new RegistryError(`Asset path not found in registry: ${relativePath}`);
  }
}
