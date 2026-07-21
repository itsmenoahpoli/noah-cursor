import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { readManifest, validateRegistryStructure } from "../registry/validator.js";
import { createTestDir, REGISTRY_PATH, removeTestDir } from "./helpers.js";
import { RegistryError } from "../core/errors.js";

describe("registry validator", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((dir) => removeTestDir(dir)));
    tempDirs.length = 0;
  });

  it("validates the example registry", async () => {
    await expect(validateRegistryStructure(REGISTRY_PATH)).resolves.toBeUndefined();
    const manifest = await readManifest(REGISTRY_PATH);
    expect(manifest.name).toBe("noah-registry");
    expect(manifest.skills.some((s) => s.id === "test")).toBe(true);
    expect(manifest.rules.some((r) => r.id === "test")).toBe(true);
  });

  it("rejects registries missing directories", async () => {
    const dir = await createTestDir("noah-bad");
    tempDirs.push(dir);
    await fs.writeJson(path.join(dir, "manifest.json"), {
      name: "bad",
      version: "1.0.0",
    });

    await expect(validateRegistryStructure(dir)).rejects.toBeInstanceOf(RegistryError);
  });

  it("rejects missing manifest", async () => {
    const dir = await createTestDir("noah-nom");
    tempDirs.push(dir);
    for (const name of ["skills", "rules", "prompts", "mcp", "presets"]) {
      await fs.ensureDir(path.join(dir, name));
    }

    await expect(readManifest(dir)).rejects.toBeInstanceOf(RegistryError);
  });
});
