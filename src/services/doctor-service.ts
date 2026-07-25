import path from "node:path";
import fs from "fs-extra";
import {
  DEFAULT_IDE,
  getIdeDefinition,
  METADATA_FILE,
  WORKSPACE_FILE,
  LOCKFILE_NAME,
  type IdeId,
} from "../constants/index.js";
import { readMetadata } from "../metadata/store.js";
import type { DoctorCheck } from "../types/index.js";
import { assetTypeToDir } from "../utils/assets.js";
import { resolveIdeDir, resolveProjectRoot } from "../utils/fs.js";
import { computeHealthScores, detectProjectStack } from "./project-awareness.js";
import { getSettings } from "../metadata/user-store.js";

export async function runDoctor(
  cwd = process.cwd(),
  ide: IdeId = DEFAULT_IDE,
): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const ideDef = getIdeDefinition(ide);

  const major = Number(process.versions.node.split(".")[0]);
  checks.push({
    name: "Node.js version",
    status: major >= 20 ? "pass" : "fail",
    message:
      major >= 20
        ? `Node.js ${process.versions.node}`
        : `Node.js ${process.versions.node} (requires >= 20)`,
  });

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

  const ideDir = resolveIdeDir(ide, cwd);
  const ideExists = await fs.pathExists(ideDir);
  checks.push({
    name: `${ideDef.rootDir}/ directory (${ideDef.name})`,
    status: ideExists ? "pass" : "warn",
    message: ideExists
      ? `Found at ${ideDir}`
      : `Missing — will be created on first install`,
  });

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

  // Project awareness
  const stack = await detectProjectStack(cwd);
  checks.push({
    name: "Framework detection",
    status: stack.frameworks.length > 0 ? "pass" : "warn",
    message:
      stack.frameworks.length > 0
        ? stack.frameworks.join(", ")
        : "No framework detected",
  });

  const health = await computeHealthScores(cwd, ide);
  checks.push({
    name: "Architecture score",
    status: health.architecture >= 5 ? "pass" : "warn",
    message: String(health.architecture),
  });
  checks.push({
    name: "Security score",
    status: health.security >= 5 ? "pass" : "warn",
    message: String(health.security),
  });
  checks.push({
    name: "Documentation score",
    status: health.documentation >= 5 ? "pass" : "warn",
    message: String(health.documentation),
  });
  checks.push({
    name: "Testing score",
    status: health.testing >= 5 ? "pass" : "warn",
    message: String(health.testing),
  });
  checks.push({
    name: "Overall health",
    status: health.overall >= 5 ? "pass" : "warn",
    message: `${health.overall} (${Math.round(health.overall * 10)}%)`,
  });

  const hasDocker =
    (await fs.pathExists(path.join(cwd, "Dockerfile"))) ||
    (await fs.pathExists(path.join(cwd, "docker-compose.yml")));
  checks.push({
    name: "Docker",
    status: hasDocker ? "pass" : "warn",
    message: hasDocker ? "Dockerfile or compose present" : "No Docker config detected",
  });

  const hasCi =
    (await fs.pathExists(path.join(cwd, ".github/workflows"))) ||
    (await fs.pathExists(path.join(cwd, ".gitlab-ci.yml")));
  checks.push({
    name: "CI",
    status: hasCi ? "pass" : "warn",
    message: hasCi ? "CI config found" : "No CI config detected",
  });

  checks.push({
    name: WORKSPACE_FILE,
    status: (await fs.pathExists(path.join(cwd, WORKSPACE_FILE))) ? "pass" : "warn",
    message: (await fs.pathExists(path.join(cwd, WORKSPACE_FILE)))
      ? "Team workspace configured"
      : "Missing — run `noah-cursor workspace init` or `bootstrap`",
  });

  checks.push({
    name: LOCKFILE_NAME,
    status: (await fs.pathExists(path.join(cwd, LOCKFILE_NAME))) ? "pass" : "warn",
    message: (await fs.pathExists(path.join(cwd, LOCKFILE_NAME)))
      ? "Lockfile present"
      : "Missing — generated on install",
  });

  const settings = await getSettings();
  if (settings.privateRegistry) {
    checks.push({
      name: "Private registry",
      status: "pass",
      message: settings.privateRegistry,
    });
  }

  return checks;
}
