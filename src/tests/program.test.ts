import { describe, expect, it } from "vitest";
import { createProgram } from "../core/program.js";

describe("CLI program", () => {
  it("registers all expected commands", () => {
    const program = createProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toEqual(
      expect.arrayContaining([
        "add",
        "install",
        "browse",
        "search",
        "preview",
        "list",
        "remove",
        "uninstall",
        "update",
        "doctor",
        "recent",
        "favorite",
        "favorites",
        "bootstrap",
        "workspace",
        "sync",
        "explain",
        "analyze",
        "wizard",
        "upgrade",
        "publish",
        "login",
        "logout",
        "whoami",
        "analytics",
        "dashboard",
        "plugin",
        "undo",
        "try",
        "new",
        "config",
        "diff",
        "trending",
        "audit",
      ]),
    );
  });

  it("exposes version from package.json", () => {
    const program = createProgram();
    expect(program.version()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("has a default action for no-subcommand usage", () => {
    const program = createProgram();
    expect(typeof (program as unknown as { _actionHandler?: unknown })._actionHandler).not.toBe(
      "undefined",
    );
  });
});
