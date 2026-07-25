import chalk from "chalk";
import boxen from "boxen";
import type { SearchResult } from "../types/index.js";
import { humanizeId } from "./format.js";

export function renderPackagePreview(pkg: SearchResult): void {
  const stars =
    pkg.rating != null
      ? "★".repeat(Math.round(pkg.rating)) + "☆".repeat(Math.max(0, 5 - Math.round(pkg.rating)))
      : "☆☆☆☆☆";

  const lines = [
    chalk.bold.cyan(humanizeId(pkg.id)),
    "",
    chalk.yellow(stars) + (pkg.rating != null ? chalk.dim(`  ${pkg.rating}`) : ""),
    "",
    chalk.dim("Downloads"),
    String(pkg.downloads ?? 0),
    "",
    chalk.dim("Updated"),
    pkg.updatedAt ? new Date(pkg.updatedAt).toLocaleDateString() : "—",
    "",
    chalk.dim("Contains"),
    `✓ ${pkg.type === "mcp" ? "MCP config" : pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1)}`,
  ];

  if (pkg.verified) lines.push("✓ Verified maintainer");
  if (pkg.dependsOn?.length) {
    lines.push("", chalk.dim("Dependencies"), ...pkg.dependsOn.map((d) => `• ${d}`));
  }
  if (pkg.description) {
    lines.push("", chalk.dim("About"), pkg.description);
  }

  console.log(
    boxen(lines.join("\n"), {
      padding: 1,
      borderColor: "cyan",
      borderStyle: "round",
    }),
  );
}
