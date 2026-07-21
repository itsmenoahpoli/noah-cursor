import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { installAsset } from "../installers/asset-installer.js";
import { readManifest } from "../registry/validator.js";
import { addFromRegistry, listRegistryAssets, searchRegistry } from "../services/install-service.js";
import { readMetadata } from "../metadata/store.js";
import { runDoctor } from "../services/doctor-service.js";
import { createTestDir, REGISTRY_PATH, removeTestDir } from "./helpers.js";

describe("install flow (local registry)", () => {
  const tempDirs: string[] = [];
  let previousCwd = process.cwd();

  afterEach(async () => {
    process.chdir(previousCwd);
    await Promise.all(tempDirs.map((dir) => removeTestDir(dir)));
    tempDirs.length = 0;
  });

  async function tempProject(): Promise<string> {
    previousCwd = process.cwd();
    const dir = await createTestDir("noah-proj");
    tempDirs.push(dir);
    process.chdir(dir);
    return dir;
  }

  it("installs a single skill", async () => {
    await tempProject();
    const manifest = await readManifest(REGISTRY_PATH);

    const result = await installAsset(REGISTRY_PATH, manifest, "skill", "test", {
      force: true,
    });

    expect(result.skipped).toBeFalsy();
    expect(
      await fs.pathExists(path.join(process.cwd(), ".cursor/skills/test/SKILL.md")),
    ).toBe(true);
  });

  it("skips existing assets without --force", async () => {
    await tempProject();
    const manifest = await readManifest(REGISTRY_PATH);

    await installAsset(REGISTRY_PATH, manifest, "skill", "test");
    const second = await installAsset(REGISTRY_PATH, manifest, "skill", "test");

    expect(second.skipped).toBe(true);
  });

  it("adds a preset via addFromRegistry", async () => {
    await tempProject();
    const results = await addFromRegistry(REGISTRY_PATH, {
      preset: "test",
      yes: true,
    });

    expect(results.some((r) => r.type === "skill" && r.id === "test")).toBe(true);
    expect(results.some((r) => r.type === "rule" && r.id === "test")).toBe(true);
    expect(await fs.pathExists(".cursor/skills/test")).toBe(true);
    expect(await fs.pathExists(".cursor/rules/test")).toBe(true);

    const meta = await readMetadata();
    expect(meta?.installed.some((a) => a.type === "preset" && a.id === "test")).toBe(true);
  });

  it("supports dry-run without writing files", async () => {
    await tempProject();
    await addFromRegistry(REGISTRY_PATH, {
      skill: "test",
      dryRun: true,
      yes: true,
    });

    expect(await fs.pathExists(".cursor/skills/test")).toBe(false);
    expect(await readMetadata()).toBeNull();
  });

  it("searches a local registry", async () => {
    await tempProject();
    const results = await searchRegistry("test", REGISTRY_PATH);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => JSON.stringify(r).toLowerCase().includes("test"))).toBe(true);
  });

  it("lists all assets from the local registry manifest", async () => {
    await tempProject();
    const listed = await listRegistryAssets(REGISTRY_PATH);
    expect(listed.assets.some((a) => a.type === "skill" && a.id === "commit-push")).toBe(true);
    expect(listed.assets.some((a) => a.type === "rule" && a.id === "laravel-api")).toBe(true);
    expect(listed.assets.some((a) => a.type === "preset" && a.id === "noah-web-stack")).toBe(true);
    expect(listed.assets.length).toBeGreaterThanOrEqual(10);
  });

  it("doctor reports checks", async () => {
    await tempProject();
    const checks = await runDoctor();
    expect(checks.some((c) => c.name === "Node.js version" && c.status === "pass")).toBe(true);
    expect(checks.some((c) => c.name === "Git")).toBe(true);
  });
});
