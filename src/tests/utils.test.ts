import { describe, expect, it } from "vitest";
import {
  displayRegistryUrl,
  normalizeGitHubUrl,
  pluralize,
} from "../utils/fs.js";
import {
  findAssetInManifest,
  listAllManifestAssets,
  resolveAssetPath,
} from "../utils/assets.js";
import type { Manifest } from "../types/index.js";

describe("normalizeGitHubUrl", () => {
  it("normalizes https URLs", () => {
    expect(normalizeGitHubUrl("https://github.com/owner/repo")).toBe(
      "https://github.com/owner/repo.git",
    );
  });

  it("accepts owner/repo shorthand", () => {
    expect(normalizeGitHubUrl("owner/repo")).toBe("https://github.com/owner/repo.git");
  });

  it("preserves git SSH URLs", () => {
    expect(normalizeGitHubUrl("git@github.com:owner/repo.git")).toBe(
      "git@github.com:owner/repo.git",
    );
  });

  it("rejects insecure http URLs", () => {
    expect(() => normalizeGitHubUrl("http://github.com/owner/repo")).toThrow(
      /http:\/\//,
    );
  });
});

describe("displayRegistryUrl", () => {
  it("strips .git suffix", () => {
    expect(displayRegistryUrl("https://github.com/a/b.git")).toBe(
      "https://github.com/a/b",
    );
  });
});

describe("pluralize", () => {
  it("handles singular and plural", () => {
    expect(pluralize(1, "asset")).toBe("asset");
    expect(pluralize(2, "asset")).toBe("assets");
  });
});

describe("asset helpers", () => {
  const manifest: Manifest = {
    name: "t",
    version: "1",
    skills: [{ id: "s1", version: "1.0.0", path: "skills/custom-s1" }],
    rules: [{ id: "r1", version: "1.0.0" }],
    prompts: [],
    mcp: [],
    presets: [
      {
        id: "p1",
        version: "1.0.0",
        includes: { skills: ["s1"], rules: ["r1"] },
      },
    ],
  };

  it("finds assets and presets", () => {
    expect(findAssetInManifest(manifest, "skill", "s1")?.id).toBe("s1");
    expect(findAssetInManifest(manifest, "preset", "p1")?.id).toBe("p1");
    expect(findAssetInManifest(manifest, "skill", "missing")).toBeUndefined();
  });

  it("resolves asset paths", () => {
    expect(resolveAssetPath("skill", "s1", "skills/custom-s1")).toBe("skills/custom-s1");
    expect(resolveAssetPath("rule", "r1")).toBe("rules/r1");
  });

  it("lists all assets", () => {
    const all = listAllManifestAssets(manifest);
    expect(all).toHaveLength(3);
    expect(all.map((a) => a.id).sort()).toEqual(["p1", "r1", "s1"]);
  });
});
