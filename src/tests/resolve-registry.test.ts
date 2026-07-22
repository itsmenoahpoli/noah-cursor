import { describe, expect, it } from "vitest";
import { BUNDLED_REGISTRY, OFFICIAL_REGISTRY } from "../constants/index.js";
import { ValidationError } from "../core/errors.js";
import { getBundledRegistryPath, resolveNoahRegistry } from "../utils/registry.js";
import { loadBundledRegistry } from "../services/registry-loader.js";
import { listAllManifestAssets } from "../utils/assets.js";

describe("resolveNoahRegistry", () => {
  it("defaults to the build-time bundled registry", () => {
    expect(resolveNoahRegistry()).toBe(BUNDLED_REGISTRY);
    expect(resolveNoahRegistry("")).toBe(BUNDLED_REGISTRY);
  });

  it("maps official remote aliases to the bundled registry", () => {
    expect(resolveNoahRegistry("itsmenoahpoli/noah-cursor")).toBe(BUNDLED_REGISTRY);
    expect(resolveNoahRegistry("https://github.com/itsmenoahpoli/noah-cursor")).toBe(
      BUNDLED_REGISTRY,
    );
    expect(resolveNoahRegistry("https://github.com/itsmenoahpoli/noah-cursor.git")).toBe(
      BUNDLED_REGISTRY,
    );
    expect(resolveNoahRegistry("git@github.com:itsmenoahpoli/noah-cursor.git")).toBe(
      BUNDLED_REGISTRY,
    );
    expect(resolveNoahRegistry(OFFICIAL_REGISTRY)).toBe(BUNDLED_REGISTRY);
  });

  it("allows local paths for development", () => {
    expect(resolveNoahRegistry(".")).toBe(".");
    expect(resolveNoahRegistry("./")).toBe("./");
    expect(resolveNoahRegistry("/tmp/noah-registry")).toBe("/tmp/noah-registry");
    expect(resolveNoahRegistry("file:///tmp/noah-registry")).toBe("file:///tmp/noah-registry");
  });

  it("rejects third-party registries", () => {
    expect(() => resolveNoahRegistry("someone/other-registry")).toThrow(ValidationError);
    expect(() =>
      resolveNoahRegistry("https://github.com/someone/other-registry"),
    ).toThrow(/official registry/);
  });
});

describe("bundled registry", () => {
  it("resolves a path that contains the Noah manifest", () => {
    const bundled = getBundledRegistryPath();
    expect(bundled.length).toBeGreaterThan(0);
  });

  it("loads skills and rules without cloning", async () => {
    const registry = await loadBundledRegistry();
    try {
      expect(registry.url).toBe(OFFICIAL_REGISTRY);
      const assets = listAllManifestAssets(registry.manifest);
      expect(assets.some((a) => a.type === "skill")).toBe(true);
      expect(assets.some((a) => a.type === "rule")).toBe(true);
      expect(assets.every((a) => a.type !== "preset")).toBe(true);
      expect(assets.length).toBeGreaterThanOrEqual(8);
    } finally {
      await registry.cleanup();
    }
  });
});
