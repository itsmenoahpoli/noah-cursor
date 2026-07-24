import path from "node:path";
import fs from "fs-extra";
import {
  DEFAULT_IDE,
  getIdeDefinition,
  METADATA_FILE,
  type IdeId,
} from "../constants/index.js";
import { readMetadata } from "../metadata/store.js";
import type { DoctorCheck } from "../types/index.js";
import { assetTypeToDir } from "../utils/assets.js";
import { resolveIdeDir, resolveProjectRoot } from "../utils/fs.js";

export async function runDoctor(
  cwd = process.cwd(),
  ide: IdeId = DEFAULT_IDE,
): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const ideDef = getIdeDefinition(ide);

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

  // IDE directory
  const ideDir = resolveIdeDir(ide, cwd);
  const ideExists = await fs.pathExists(ideDir);
  checks.push({
    name: `${ideDef.rootDir}/ directory (${ideDef.name})`,
    status: ideExists ? "pass" : "warn",
    message: ideExists
      ? `Found at ${ideDir}`
      : `Missing — will be created on first install`,
  });

  // Metadata
  const metadataPath = path.join(ideDir, METADATA_FILE);
  const metadata = await readMetadata(cwd, ide).catch(() => null);

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
      const assetPath = path.join(ideDir, assetTypeToDir(asset.type), asset.id);
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

  // Git availability (optional; registry ships bundled with the package)
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
      status: "warn",
      message: "Git not found (optional — registry is bundled with the package)",
    });
  }

  return checks;
}
