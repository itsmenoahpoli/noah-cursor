import { describe, expect, it } from "vitest";
import { ManifestSchema, NoahMetadataSchema } from "../types/index.js";

describe("ManifestSchema", () => {
  it("parses a valid manifest", () => {
    const result = ManifestSchema.parse({
      name: "demo",
      version: "1.0.0",
      skills: [{ id: "a", version: "1.0.0" }],
      rules: [],
      prompts: [],
      mcp: [],
      presets: [
        {
          id: "p1",
          version: "1.0.0",
          includes: { skills: ["a"] },
        },
      ],
    });

    expect(result.name).toBe("demo");
    expect(result.skills).toHaveLength(1);
    expect(result.presets[0]?.includes.skills).toEqual(["a"]);
  });

  it("applies defaults for missing asset arrays", () => {
    const result = ManifestSchema.parse({
      name: "demo",
      version: "1.0.0",
    });
    expect(result.skills).toEqual([]);
    expect(result.presets).toEqual([]);
  });

  it("rejects empty name", () => {
    expect(() => ManifestSchema.parse({ name: "", version: "1" })).toThrow();
  });
});

describe("NoahMetadataSchema", () => {
  it("parses metadata", () => {
    const result = NoahMetadataSchema.parse({
      registry: "https://github.com/owner/registry",
      installed: [{ type: "skill", id: "test", version: "1.0.0" }],
    });
    expect(result.installed).toHaveLength(1);
  });
});
