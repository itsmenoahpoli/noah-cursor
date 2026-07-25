import path from "node:path";
import fs from "fs-extra";
import { input, select, confirm } from "@inquirer/prompts";
import { ASSET_DIRECTORIES, ASSET_TYPES, MANIFEST_FILE } from "../constants/index.js";
import { ValidationError } from "../core/errors.js";
import { logInfo, logSuccess, logTitle } from "../core/logger.js";
import { ManifestSchema, type AssetType, type SearchResult } from "../types/index.js";
import { listRegistryAssets } from "./install-service.js";
import { appendAudit, readUserStore, writeUserStore } from "../metadata/user-store.js";

export async function listTrending(
  period: "today" | "week" | "month" = "week",
  options: { verbose?: boolean } = {},
): Promise<SearchResult[]> {
  const listed = await listRegistryAssets(undefined, options);
  const sorted = [...listed.assets].sort((a, b) => {
    const da = a.downloads ?? 0;
    const db = b.downloads ?? 0;
    if (db !== da) return db - da;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
  // Period is reserved for future registry API; local registry uses downloads/rating.
  void period;
  return sorted.slice(0, 10);
}

export async function login(username?: string): Promise<{ username: string }> {
  const name =
    username ??
    (await input({
      message: "Username / email",
      validate: (v) => (v.trim().length > 0 ? true : "Required"),
    }));
  const store = await readUserStore();
  store.auth = {
    username: name.trim(),
    token: `local-${Buffer.from(name.trim()).toString("base64url")}`,
    loggedInAt: new Date().toISOString(),
  };
  await writeUserStore(store);
  await appendAudit("login", name.trim());
  logSuccess(`Logged in as ${name.trim()}`);
  logInfo("Token stored locally in ~/.noah (for future publish/sync).");
  return { username: name.trim() };
}

export async function logout(): Promise<void> {
  const store = await readUserStore();
  store.auth = undefined;
  await writeUserStore(store);
  await appendAudit("logout");
  logSuccess("Logged out.");
}

export async function whoami(): Promise<string | null> {
  const store = await readUserStore();
  return store.auth?.username ?? null;
}

export async function runPublishWizard(cwd = process.cwd()): Promise<void> {
  const store = await readUserStore();
  if (!store.auth?.username) {
    logInfo("Not logged in. Run `noah-cursor login` first (local auth).");
  }

  const type = (await select({
    message: "Package type",
    choices: ASSET_TYPES.filter((t) => t !== "preset").map((t) => ({ name: t, value: t })),
  })) as Exclude<AssetType, "preset">;

  const id = await input({
    message: "Package id (kebab-case)",
    validate: (v) => (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) ? true : "Use kebab-case id"),
  });

  const description = await input({
    message: "Short description",
    default: "",
  });

  const version = await input({
    message: "Version",
    default: "1.0.0",
  });

  const dirName = ASSET_DIRECTORIES[type];
  const targetDir = path.join(cwd, dirName, id);
  if (await fs.pathExists(targetDir)) {
    throw new ValidationError(`${dirName}/${id} already exists`);
  }

  const ok = await confirm({
    message: `Create ${dirName}/${id} and register in ${MANIFEST_FILE}?`,
    default: true,
  });
  if (!ok) {
    logInfo("Publish cancelled.");
    return;
  }

  await fs.ensureDir(targetDir);
  const body =
    type === "skill"
      ? `# ${id}\n\n${description}\n`
      : type === "rule"
        ? `# ${id}\n\n${description}\n`
        : `${description}\n`;

  const fileName = type === "skill" || type === "rule" ? (type === "skill" ? "SKILL.md" : "RULE.md") : "README.md";
  await fs.writeFile(path.join(targetDir, fileName), body, "utf8");

  const manifestPath = path.join(cwd, MANIFEST_FILE);
  if (await fs.pathExists(manifestPath)) {
    const raw = await fs.readJson(manifestPath);
    const manifest = ManifestSchema.parse(raw);
    const entry = {
      id,
      version,
      description: description || undefined,
      tags: [] as string[],
      author: store.auth?.username,
      verified: false,
      downloads: 0,
      rating: 0,
      updatedAt: new Date().toISOString(),
      changelog: "Initial release",
    };
    if (type === "skill") manifest.skills.push(entry);
    else if (type === "rule") manifest.rules.push(entry);
    else if (type === "prompt") manifest.prompts.push(entry);
    else if (type === "mcp") manifest.mcp.push(entry);
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
  }

  await appendAudit("publish", `${type}/${id}@${version}`);
  logSuccess(`Scaffolded ${dirName}/${id}`);
  logTitle("Next steps");
  console.log("  1. Edit the package content");
  console.log("  2. Commit and open a PR to the Noah registry");
  console.log("  3. After merge, users can: noah-cursor install " + `${type}/${id}`);
}

export async function getAnalyticsSummary(): Promise<{
  favorites: number;
  recent: number;
  auditEvents: number;
  loggedIn: boolean;
}> {
  const store = await readUserStore();
  return {
    favorites: store.favorites.length,
    recent: store.recent.length,
    auditEvents: store.auditLog.length,
    loggedIn: Boolean(store.auth?.username),
  };
}
