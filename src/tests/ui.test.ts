import { describe, expect, it } from "vitest";
import { humanizeId, formatAssetLabel } from "../ui/format.js";
import { CATEGORY_OPTIONS } from "../ui/categoryMenu.js";

describe("UI helpers", () => {
  it("humanizes asset ids", () => {
    expect(humanizeId("laravel-crud")).toBe("Laravel Crud");
    expect(humanizeId("react_hooks")).toBe("React Hooks");
  });

  it("formats labels with optional description", () => {
    expect(formatAssetLabel("test")).toContain("Test");
    expect(formatAssetLabel("test", "Sample skill")).toContain("Sample skill");
  });

  it("exposes all browse categories", () => {
    expect(CATEGORY_OPTIONS.map((c) => c.value)).toEqual([
      "skill",
      "rule",
      "prompt",
      "mcp",
      "preset",
    ]);
  });
});
