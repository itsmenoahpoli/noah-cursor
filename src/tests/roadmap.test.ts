import { afterEach, describe, expect, it } from "vitest";
import path from "node:path";
import fs from "fs-extra";
import { createTestDir, removeTestDir, REGISTRY_PATH } from "./helpers.js";
import { fuzzyScore, fuzzyFilter } from "../utils/fuzzy.js";
import { parsePackageRef, versionMatches } from "../utils/semver.js";
import {
  detectProjectStack,
  computeHealthScores,
  recommendPackages,
} from "../services/project-awareness.js";
import { writeLockfile, readLockfile } from "../services/lockfile-service.js";
import { initWorkspace, readWorkspace } from "../services/workspace-service.js";
import { expandDependencies, searchRegistry } from "../services/install-service.js";
import { loadRegistry } from "../services/registry-loader.js";
import { BUNDLED_REGISTRY } from "../constants/index.js";

describe("roadmap utilities", () => {
  let tmp: string;
  const prevCwd = process.cwd();

  afterEach(async () => {
    process.chdir(prevCwd);
    if (tmp) await removeTestDir(tmp);
  });

  it("fuzzy scores exact and partial matches", () => {
    expect(fuzzyScore("laravel", "laravel-api")).toBeGreaterThan(fuzzyScore("laravel", "react-spa"));
    expect(fuzzyScore("xyz", "laravel")).toBe(0);
  });

  it("fuzzy filters ranked results", () => {
    const items = [{ id: "laravel-api" }, { id: "react-spa" }, { id: "larastan-fix" }];
    const hits = fuzzyFilter(items, "lara", (i) => i.id);
    expect(hits[0]?.id).toMatch(/lara/);
  });

  it("parses package refs with type and version", () => {
    expect(parsePackageRef("rule/laravel-api@1.0.0")).toEqual({
      type: "rule",
      id: "laravel-api",
      version: "1.0.0",
    });
    expect(versionMatches("1.0.0", "1.0")).toBe(true);
    expect(versionMatches("2.0.0", "1.0")).toBe(false);
  });

  it("detects stack from package.json", async () => {
    tmp = await createTestDir("stack");
    await fs.writeJson(path.join(tmp, "package.json"), {
      dependencies: { react: "^19.0.0", next: "^15.0.0" },
    });
    const stack = await detectProjectStack(tmp);
    expect(stack.frameworks).toEqual(expect.arrayContaining(["React", "Next.js"]));
  });

  it("computes health scores", async () => {
    tmp = await createTestDir("health");
    await fs.writeFile(path.join(tmp, "README.md"), "# hi");
    await fs.writeFile(path.join(tmp, ".gitignore"), "node_modules");
    const scores = await computeHealthScores(tmp);
    expect(scores.overall).toBeGreaterThan(0);
    expect(scores.documentation).toBeGreaterThan(0);
  });

  it("writes and reads lockfile + workspace", async () => {
    tmp = await createTestDir("lock");
    process.chdir(tmp);
    await writeLockfile(
      [{ type: "rule", id: "laravel-api", version: "1.0.0" }],
      "cursor",
      tmp,
    );
    const lock = await readLockfile(tmp);
    expect(lock?.packages).toHaveLength(1);

    await initWorkspace({ ide: "cursor", packages: ["rule/laravel-api"] }, tmp);
    const ws = await readWorkspace(tmp);
    expect(ws?.packages).toContain("rule/laravel-api");
  });

  it("fuzzy searches registry", async () => {
    const results = await searchRegistry("laravel", REGISTRY_PATH);
    expect(results.some((r) => r.id.includes("laravel"))).toBe(true);
  });

  it("expands dependsOn edges", async () => {
    const registry = await loadRegistry(BUNDLED_REGISTRY);
    try {
      const expanded = expandDependencies(registry.manifest, [
        { type: "skill", id: "larastan-fix" },
      ]);
      expect(expanded.some((r) => r.id === "laravel-api")).toBe(true);
    } finally {
      await registry.cleanup();
    }
  });

  it("recommends packages for laravel composer projects", async () => {
    tmp = await createTestDir("rec");
    await fs.writeJson(path.join(tmp, "composer.json"), {
      require: { "laravel/framework": "^12.0" },
    });
    await fs.writeFile(path.join(tmp, "artisan"), "#!/usr/bin/env php\n");
    const recs = await recommendPackages(tmp, { limit: 10 });
    expect(recs.some((r) => r.id.includes("laravel") || (r.tags ?? []).includes("laravel"))).toBe(
      true,
    );
  });
});
