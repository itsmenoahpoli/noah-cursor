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

function figletLine(text: string): string {
  return figlet.textSync(text, {
    font: "ANSI Shadow",
    horizontalLayout: "fitted",
    verticalLayout: "default",
  });
}

/**
 * Renders the NOAH DEV CLI banner once per process.
 */
export function renderBanner(force = false): void {
  if (!force && shown) {
    return;
  }
  if (!force && !shouldShowBanner()) {
    return;
  }

  shown = true;

  // Two lines so ANSI Shadow stays readable on typical terminal widths
  const ascii = figletLine("NOAH DEV CLI");

  console.log();
  console.log(brandGradient.multiline(ascii));
  console.log(chalk.dim("  The package manager for AI-assisted software development"));
  console.log(chalk.dim("  Skills · Rules · Prompts · MCP · Presets — Cursor & beyond"));
  console.log();
}

export function resetBannerForTests(): void {
  shown = false;
}
