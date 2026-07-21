import { describe, expect, it } from "vitest";
import { createProgram } from "../core/program.js";

describe("CLI program", () => {
  it("registers all expected commands", () => {
    const program = createProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toEqual(
      expect.arrayContaining([
        "add",
        "browse",
        "search",
        "list",
        "remove",
        "update",
        "doctor",
      ]),
    );
  });

  it("exposes version from package.json", () => {
    const program = createProgram();
    expect(program.version()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("has a default action for no-subcommand usage", () => {
    const program = createProgram();
    // Root action is registered so bare invocation is not treated as an error
    expect(typeof (program as unknown as { _actionHandler?: unknown })._actionHandler).not.toBe(
      "undefined",
    );
  });
});
