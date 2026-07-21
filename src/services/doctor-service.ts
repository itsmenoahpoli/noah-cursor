import path from "node:path";
import fs from "fs-extra";
import { CURSOR_DIR, METADATA_FILE } from "../constants/index.js";
import { readMetadata } from "../metadata/store.js";
import type { DoctorCheck } from "../types/index.js";
import { assetTypeToDir } from "../utils/assets.js";
import { resolveCursorDir, resolveProjectRoot } from "../utils/fs.js";

export async function runDoctor(cwd = process.cwd()): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];

  // Node version
  const major = Number(process.versions.node.split(".")[0]);
  checks.push({
    name: "Node.js version",
    status: major >= 20 ? "pass" : "fail",
    message:
      major >= 20
        ? `Node.js ${process.versions.node}`
        : `Node.js ${process.versions.node} (requires >= 20)`,
  });

  // Project writable
  const root = resolveProjectRoot(cwd);
  try {
    await fs.access(root, fs.constants.W_OK);
    checks.push({
      name: "Project directory writable",
      status: "pass",
      message: root,
    });
  } catch {
    checks.push({
      name: "Project directory writable",
      status: "fail",
      message: `Cannot write to ${root}`,
    });
  }

  // .cursor directory
  const cursorDir = resolveCursorDir(cwd);
  const cursorExists = await fs.pathExists(cursorDir);
  checks.push({
    name: `${CURSOR_DIR}/ directory`,
    status: cursorExists ? "pass" : "warn",
    message: cursorExists
      ? `Found at ${cursorDir}`
      : `Missing — will be created on first install`,
  });

  // Metadata
  const metadataPath = path.join(cursorDir, METADATA_FILE);
  const metadata = await readMetadata(cwd).catch(() => null);

  if (!(await fs.pathExists(metadataPath))) {
    checks.push({
      name: METADATA_FILE,
      status: "warn",
      message: "Not found — no assets installed yet",
    });
  } else if (!metadata) {
    checks.push({
      name: METADATA_FILE,
      status: "fail",
      message: "Exists but is invalid or unreadable",
    });
  } else {
    checks.push({
      name: METADATA_FILE,
      status: "pass",
      message: `${metadata.installed.length} installed asset(s) from ${metadata.registry}`,
    });

    // Orphan / missing file checks
    let missingFiles = 0;
    for (const asset of metadata.installed) {
      if (asset.type === "preset") continue;
      const assetPath = path.join(cursorDir, assetTypeToDir(asset.type), asset.id);
      if (!(await fs.pathExists(assetPath))) {
        missingFiles += 1;
      }
    }

    checks.push({
      name: "Installed asset files",
      status: missingFiles === 0 ? "pass" : "warn",
      message:
        missingFiles === 0
          ? "All recorded assets are present on disk"
          : `${missingFiles} recorded asset(s) missing from disk`,
    });
  }

  // Git availability (needed for clone)
  try {
    const { execa } = await import("execa");
    const result = await execa("git", ["--version"]);
    checks.push({
      name: "Git",
      status: "pass",
      message: result.stdout.trim(),
    });
  } catch {
    checks.push({
      name: "Git",
      status: "fail",
      message: "Git is required to clone registries",
    });
  }

  return checks;
}
