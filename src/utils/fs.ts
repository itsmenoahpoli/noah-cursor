import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import {
  DEFAULT_IDE,
  getIdeDefinition,
  TEMP_DIR_PREFIX,
  type IdeId,
} from "../constants/index.js";
import { ValidationError } from "../core/errors.js";

export async function createTempDir(prefix = TEMP_DIR_PREFIX): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await fs.remove(dir);
  } catch {
    // Best-effort cleanup
  }
}

export function resolveProjectRoot(cwd = process.cwd()): string {
  return path.resolve(cwd);
}

/** Resolve the IDE config root (e.g. `.cursor`, `.windsurf`, `.claude`). */
export function resolveIdeDir(ide: IdeId = DEFAULT_IDE, cwd = process.cwd()): string {
  return path.join(resolveProjectRoot(cwd), getIdeDefinition(ide).rootDir);
}

/** @deprecated Use resolveIdeDir("cursor", cwd) */
export function resolveCursorDir(cwd = process.cwd()): string {
  return resolveIdeDir("cursor", cwd);
}

export function normalizeGitHubUrl(input: string): string {
  const trimmed = input.trim().replace(/\/$/, "");

  if (trimmed.startsWith("git@")) {
    return trimmed.endsWith(".git") ? trimmed : `${trimmed}.git`;
  }

  if (trimmed.startsWith("http://")) {
    throw new ValidationError(
      "Insecure http:// registry URLs are not allowed. Use https:// or git@ SSH URLs.",
    );
  }

  if (trimmed.startsWith("https://")) {
    return trimmed.endsWith(".git") ? trimmed : `${trimmed}.git`;
  }

  // owner/repo shorthand
  if (/^[\w.-]+\/[\w.-]+$/.test(trimmed)) {
    return `https://github.com/${trimmed}.git`;
  }

  return trimmed.endsWith(".git") ? trimmed : `${trimmed}.git`;
}

export function displayRegistryUrl(url: string): string {
  return url.replace(/\.git$/, "");
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
