import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { TEMP_DIR_PREFIX } from "../constants/index.js";

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

export function resolveCursorDir(cwd = process.cwd()): string {
  return path.join(resolveProjectRoot(cwd), ".cursor");
}

export function normalizeGitHubUrl(input: string): string {
  const trimmed = input.trim().replace(/\/$/, "");

  if (trimmed.startsWith("git@")) {
    return trimmed.endsWith(".git") ? trimmed : `${trimmed}.git`;
  }

  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
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
