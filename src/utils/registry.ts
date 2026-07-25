import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import {
  BUNDLED_REGISTRY,
  MANIFEST_FILE,
  OFFICIAL_REGISTRY,
  OFFICIAL_REGISTRY_OWNER,
  OFFICIAL_REGISTRY_REPO,
  PUBLIC_REGISTRY_LABEL,
  REGISTRY_REQUIRED_DIRS,
} from "../constants/index.js";
import { RegistryError, ValidationError } from "../core/errors.js";
import { displayRegistryUrl, normalizeGitHubUrl } from "./fs.js";

function looksLikeGitHubRemote(input: string): boolean {
  return (
    input.includes("github.com") ||
    input.startsWith("git@") ||
    input.startsWith("http://") ||
    input.startsWith("https://") ||
    /^[\w.-]+\/[\w.-]+$/.test(input)
  );
}

export function isOfficialRegistryUrl(url: string): boolean {
  const normalized = displayRegistryUrl(url).toLowerCase();
  const expected = OFFICIAL_REGISTRY.toLowerCase();
  const shorthand = `${OFFICIAL_REGISTRY_OWNER}/${OFFICIAL_REGISTRY_REPO}`.toLowerCase();

  return (
    normalized === expected ||
    normalized === `${expected}.git` ||
    normalized.endsWith(`github.com/${shorthand}`) ||
    normalized === `git@github.com:${shorthand}` ||
    normalized === `git@github.com:${shorthand}.git`
  );
}

/**
 * Path to the registry shipped with this package (`dist/registry`),
 * or the repo root when running from source / before bundle.
 */
export function getBundledRegistryPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));

  const candidates = [
    path.resolve(here, "../noah-registry"), // dist/utils → dist/noah-registry
    path.resolve(here, "../.."), // src/utils → package root (tsx / tests)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, MANIFEST_FILE))) {
      return candidate;
    }
  }

  throw new RegistryError(
    "Bundled Noah registry not found. Run `npm run build` to generate dist/noah-registry.",
  );
}

/**
 * Resolve the registry source for this CLI.
 *
 * Defaults to the build-time bundled registry (no GitHub clone).
 * Local paths (`.`, `./…`, absolute, `file://`) remain allowed for development.
 * Official remote aliases also map to the bundled registry.
 */
/**
 * Resolve the registry source for this CLI.
 * Local paths and the official registry always work.
 * Other remotes require `allowPrivate` (enterprise private registry).
 */
export function resolveNoahRegistry(
  input?: string,
  options: { allowPrivate?: boolean } = {},
): string {
  if (!input || input.trim() === "") {
    return BUNDLED_REGISTRY;
  }

  const trimmed = input.trim();

  if (trimmed === BUNDLED_REGISTRY) {
    return BUNDLED_REGISTRY;
  }

  if (!looksLikeGitHubRemote(trimmed)) {
    return trimmed;
  }

  const normalized = displayRegistryUrl(normalizeGitHubUrl(trimmed));
  if (isOfficialRegistryUrl(normalized)) {
    return BUNDLED_REGISTRY;
  }

  if (options.allowPrivate) {
    return normalizeGitHubUrl(trimmed);
  }

  throw new ValidationError(
    `noah-cursor only installs Noah's official registry assets (${OFFICIAL_REGISTRY}) ` +
      "unless a private registry is configured (`noah-cursor config --private-registry <url>`).",
  );
}

/** True when cwd looks like the Noah registry checkout (manifest + asset dirs). */
export async function isLocalNoahRegistry(cwd = process.cwd()): Promise<boolean> {
  const manifestPath = path.join(cwd, MANIFEST_FILE);
  if (!(await fs.pathExists(manifestPath))) {
    return false;
  }

  for (const dir of REGISTRY_REQUIRED_DIRS) {
    if (!(await fs.pathExists(path.join(cwd, dir)))) {
      return false;
    }
  }

  try {
    const manifest = (await fs.readJson(manifestPath)) as { name?: string };
    return typeof manifest.name === "string" && manifest.name.length > 0;
  } catch {
    return false;
  }
}

/**
 * Prefer the local checkout when running inside this registry project;
 * otherwise leave unset so callers default to the bundled registry.
 */
export async function preferLocalRegistry(cwd = process.cwd()): Promise<string | undefined> {
  if (await isLocalNoahRegistry(cwd)) {
    return cwd;
  }
  return undefined;
}

function isPrivatePath(url: string): boolean {
  const value = url.trim();
  return (
    value.startsWith("file:") ||
    value.startsWith(".") ||
    value.startsWith("/") ||
    path.isAbsolute(value) ||
    value === BUNDLED_REGISTRY
  );
}

/**
 * User-facing registry label. Never exposes local directories or file:// URLs.
 */
export function toPublicRegistryLabel(_url?: string): string {
  return PUBLIC_REGISTRY_LABEL;
}

/**
 * Canonical URL stored in `.cursor/noah.json`. Never persists local paths.
 */
export function toStoredRegistryUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || isPrivatePath(trimmed) || isOfficialRegistryUrl(trimmed)) {
    return OFFICIAL_REGISTRY;
  }
  if (looksLikeGitHubRemote(trimmed) && isOfficialRegistryUrl(displayRegistryUrl(normalizeGitHubUrl(trimmed)))) {
    return OFFICIAL_REGISTRY;
  }
  return OFFICIAL_REGISTRY;
}
