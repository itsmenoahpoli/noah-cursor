import chalk from "chalk";
import figlet from "figlet";
import gradient from "gradient-string";

/** Light purple (top) → sky blue → deep blue (bottom) */
const brandGradient = gradient([
  "#e9d5ff", // light purple
  "#c4b5fd", // soft violet
  "#7dd3fc", // light sky blue
  "#38bdf8", // blue
  "#1d4ed8", // deep blue (bottom)
]);

let shown = false;

export function shouldShowBanner(argv = process.argv): boolean {
  if (process.env.NOAH_CURSOR_NO_BANNER === "1") {
    return false;
  }
  if (argv.includes("--no-banner")) {
    return false;
  }
  // Quiet for machine-readable / piped usage
  if (!process.stdout.isTTY) {
    return false;
  }
  // Keep -V/--version clean
  if (argv.includes("-V") || argv.includes("--version")) {
    return false;
  }
  return true;
}

/**
 * Renders the NOAH CURSOR CLI banner once per process.
 */
export function renderBanner(force = false): void {
  if (!force && shown) {
    return;
  }
  if (!force && !shouldShowBanner()) {
    return;
  }

  shown = true;

  const ascii = figlet.textSync("NOAH", {
    font: "ANSI Shadow",
    horizontalLayout: "default",
    verticalLayout: "default",
  });

  console.log();
  console.log(brandGradient.multiline(ascii));
  console.log(chalk.bold(brandGradient("  NOAH CURSOR CLI")));
  console.log(
    chalk.dim(
      "  Disclaimer: Not limited to Cursor — works with any IDE that supports",
    ),
  );
  console.log(chalk.dim("  skills, rules, prompts, MCP configs, and similar assets."));
  console.log(chalk.dim("  Package Manager for Cursor Assets"));
  console.log();
}

export function resetBannerForTests(): void {
  shown = false;
}
