import path from "node:path";
import { ValidationError } from "../core/errors.js";

/** Single path segment for asset ids (no slashes or traversal). */
export const ASSET_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

/** Relative registry paths like `skills/foo` or `skills/foo/bar`. */
export const RELATIVE_ASSET_PATH_PATTERN =
  /^[a-zA-Z0-9][a-zA-Z0-9._-]*(?:\/[a-zA-Z0-9][a-zA-Z0-9._-]*)*$/;

export function isSafeAssetId(id: string): boolean {
  return ASSET_ID_PATTERN.test(id);
}

export function assertSafeAssetId(id: string, label = "Asset id"): string {
  if (!isSafeAssetId(id)) {
    throw new ValidationError(
      `${label} "${id}" is invalid. Use only letters, numbers, dots, underscores, and hyphens (no path separators).`,
    );
  }
  return id;
}

/**
 * Normalize and validate a registry-relative asset path (forward slashes only).
 * Rejects absolute paths, `..`, empty segments, and backslashes.
 */
export function assertSafeRelativePath(rel: string, label = "Asset path"): string {
  const trimmed = rel.trim();
  if (!trimmed) {
    throw new ValidationError(`${label} must not be empty`);
  }

  const normalized = trimmed.replace(/\\/g, "/");

  if (
    path.isAbsolute(normalized) ||
    normalized.startsWith("/") ||
    /^[a-zA-Z]:/.test(normalized) ||
    normalized.includes("\0")
  ) {
    throw new ValidationError(`${label} must be a relative path inside the registry`);
  }

  const segments = normalized.split("/");
  if (
    segments.length === 0 ||
    segments.some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new ValidationError(
      `${label} "${rel}" must not contain empty segments, '.' or '..'`,
    );
  }

  if (!RELATIVE_ASSET_PATH_PATTERN.test(normalized)) {
    throw new ValidationError(
      `${label} "${rel}" contains invalid characters. Use letters, numbers, dots, underscores, hyphens, and '/' separators.`,
    );
  }

  return normalized;
}

/**
 * Ensure `candidate` resolves inside `root` (or equals root).
 * Returns the resolved candidate path.
 */
export function assertPathInside(
  root: string,
  candidate: string,
  label = "Path",
): string {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ValidationError(
      `${label} escapes the allowed directory (${resolvedRoot}): ${candidate}`,
    );
  }

  return resolvedCandidate;
}
