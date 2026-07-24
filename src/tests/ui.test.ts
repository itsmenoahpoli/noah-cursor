import { describe, expect, it } from "vitest";
import { humanizeId, formatAssetLabel } from "../ui/format.js";
import { CATEGORY_OPTIONS } from "../ui/categoryMenu.js";
import { IDE_DEFINITIONS, DEFAULT_IDE, parseIdeId } from "../constants/index.js";

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

  it("exposes IDE targets with Cursor as default", () => {
    expect(DEFAULT_IDE).toBe("cursor");
    expect(IDE_DEFINITIONS.map((ide) => ide.id)).toContain("cursor");
    expect(IDE_DEFINITIONS.map((ide) => ide.id)).toContain("windsurf");
    expect(parseIdeId(undefined)).toBe("cursor");
    expect(parseIdeId("claude-code")).toBe("claude-code");
    expect(() => parseIdeId("notepad")).toThrow(/Unknown IDE/);
  });
});
