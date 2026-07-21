import { afterEach, describe, expect, it } from "vitest";
import {
  renderBanner,
  resetBannerForTests,
  shouldShowBanner,
} from "../ui/banner.js";

describe("banner", () => {
  afterEach(() => {
    resetBannerForTests();
    delete process.env.NOAH_CURSOR_NO_BANNER;
  });

  it("hides when NOAH_CURSOR_NO_BANNER is set", () => {
    process.env.NOAH_CURSOR_NO_BANNER = "1";
    expect(shouldShowBanner(["node", "noah-cursor", "list"])).toBe(false);
  });

  it("hides for --version", () => {
    expect(shouldShowBanner(["node", "noah-cursor", "--version"])).toBe(false);
  });

  it("hides for --no-banner", () => {
    expect(shouldShowBanner(["node", "noah-cursor", "--no-banner", "list"])).toBe(false);
  });

  it("renders NOAH DEV CLI once per process", () => {
    const logs: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };

    try {
      renderBanner(true);
      renderBanner();
      const joined = logs.join("\n");
      expect(joined).toContain("Noah's Skills, Rules, Prompts, MCP configs & Presets");
      expect(joined).toContain("Disclaimer");
      expect(joined.split("Noah's Skills, Rules, Prompts, MCP configs & Presets").length - 1).toBe(1);
    } finally {
      console.log = original;
    }
  });
});
