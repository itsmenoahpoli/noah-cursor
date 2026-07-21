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

  it("exposes version", () => {
    const program = createProgram();
    expect(program.version()).toBe("1.0.0");
  });
});
