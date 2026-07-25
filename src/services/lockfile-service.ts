import path from "node:path";
import fs from "fs-extra";
import { DEFAULT_IDE, LOCKFILE_NAME, type IdeId } from "../constants/index.js";
import { LockfileSchema, type InstalledAsset, type Lockfile } from "../types/index.js";

export function getLockfilePath(cwd = process.cwd()): string {
  return path.join(cwd, LOCKFILE_NAME);
}

export async function readLockfile(cwd = process.cwd()): Promise<Lockfile | null> {
  const lockPath = getLockfilePath(cwd);
  if (!(await fs.pathExists(lockPath))) return null;
  try {
    return LockfileSchema.parse(await fs.readJson(lockPath));
  } catch {
    return null;
  }
}

export async function writeLockfile(
  packages: InstalledAsset[],
  ide: IdeId = DEFAULT_IDE,
  cwd = process.cwd(),
): Promise<Lockfile> {
  const lockfile: Lockfile = {
    version: 1,
    ide,
    updatedAt: new Date().toISOString(),
    packages: packages
      .filter((p) => p.type !== "preset" || true)
      .map((p) => ({ type: p.type, id: p.id, version: p.version }))
      .sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`)),
  };
  const parsed = LockfileSchema.parse(lockfile);
  await fs.writeJson(getLockfilePath(cwd), parsed, { spaces: 2 });
  return parsed;
}

export async function syncLockfileFromInstalled(
  installed: InstalledAsset[],
  ide: IdeId = DEFAULT_IDE,
  cwd = process.cwd(),
): Promise<Lockfile> {
  return writeLockfile(installed, ide, cwd);
}
