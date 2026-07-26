import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { ValidationError } from "../core/errors.js";
import { installAsset, removeAssetFiles } from "../installers/asset-installer.js";
import { readManifest } from "../registry/validator.js";
import { normalizeGitHubUrl } from "../utils/fs.js";
import {
  assertPathInside,
  assertSafeAssetId,
  assertSafeRelativePath,
} from "../utils/paths.js";
import { ManifestSchema } from "../types/index.js";
import { createTestDir, REGISTRY_PATH, removeTestDir } from "./helpers.js";

describe("path containment helpers", () => {
  it("accepts safe asset ids", () => {
    expect(assertSafeAssetId("commit-push")).toBe("commit-push");
    expect(assertSafeAssetId("node.doctor_1")).toBe("node.doctor_1");
  });

  it("rejects traversal asset ids", () => {
    expect(() => assertSafeAssetId("../rules/x")).toThrow(ValidationError);
    expect(() => assertSafeAssetId("foo/bar")).toThrow(ValidationError);
    expect(() => assertSafeAssetId("..")).toThrow(ValidationError);
  });

  it("accepts safe relative registry paths", () => {
    expect(assertSafeRelativePath("skills/test")).toBe("skills/test");
    expect(assertSafeRelativePath("skills/custom-s1")).toBe("skills/custom-s1");
  });

  it("rejects unsafe relative paths", () => {
    expect(() => assertSafeRelativePath("../package.json")).toThrow(ValidationError);
    expect(() => assertSafeRelativePath("skills/../secrets")).toThrow(ValidationError);
    expect(() => assertSafeRelativePath("/etc/passwd")).toThrow(ValidationError);
  });

  it("detects path escape with assertPathInside", () => {
    const root = path.resolve("/tmp/noah-root");
    expect(assertPathInside(root, path.join(root, "skills/a"))).toBe(
      path.resolve(root, "skills/a"),
    );
    expect(() => assertPathInside(root, path.join(root, "..", "outside"))).toThrow(
      ValidationError,
    );
  });
});

describe("normalizeGitHubUrl hardening", () => {
  it("rejects http:// URLs", () => {
    expect(() => normalizeGitHubUrl("http://github.com/owner/repo")).toThrow(
      ValidationError,
    );
  });
});

describe("ManifestSchema path/id hardening", () => {
  it("rejects traversal ids and paths", () => {
    expect(() =>
      ManifestSchema.parse({
        name: "x",
        version: "1",
        skills: [{ id: "../evil", version: "1.0.0" }],
      }),
    ).toThrow();

    expect(() =>
      ManifestSchema.parse({
        name: "x",
        version: "1",
        skills: [{ id: "ok", version: "1.0.0", path: "../package.json" }],
      }),
    ).toThrow();
  });
});

describe("install/remove containment", () => {
  const tempDirs: string[] = [];
  let previousCwd = process.cwd();

  afterEach(async () => {
    process.chdir(previousCwd);
    await Promise.all(tempDirs.map((dir) => removeTestDir(dir)));
    tempDirs.length = 0;
  });

  async function tempProject(): Promise<string> {
    previousCwd = process.cwd();
    const dir = await createTestDir("noah-secure");
    tempDirs.push(dir);
    process.chdir(dir);
    return dir;
  }

  it("blocks remove with traversal id", async () => {
    await tempProject();
    await fs.ensureDir(".cursor/rules/victim");
    await fs.writeFile(".cursor/rules/victim/RULE.md", "keep");

    await expect(
      removeAssetFiles("skill", "../rules/victim", { cwd: process.cwd() }),
    ).rejects.toThrow(ValidationError);

    expect(await fs.pathExists(".cursor/rules/victim/RULE.md")).toBe(true);
  });

  it("blocks install with hostile manifest path", async () => {
    await tempProject();
    const manifest = await readManifest(REGISTRY_PATH);
    manifest.skills.push({
      id: "pwn",
      version: "1.0.0",
      path: "../package.json",
    });

    await expect(
      installAsset(REGISTRY_PATH, manifest, "skill", "pwn", {
        force: true,
        cwd: process.cwd(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("blocks install with hostile asset id", async () => {
    await tempProject();
    const manifest = await readManifest(REGISTRY_PATH);
    manifest.skills.push({
      id: "../../escape-out",
      version: "1.0.0",
      path: "skills/test",
    });

    await expect(
      installAsset(REGISTRY_PATH, manifest, "skill", "../../escape-out", {
        force: true,
        cwd: process.cwd(),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
