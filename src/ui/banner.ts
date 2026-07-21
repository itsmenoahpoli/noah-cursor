import chalk from "chalk";
import figlet from "figlet";
import gradient from "gradient-string";

const noahGradient = gradient(["#38bdf8", "#818cf8", "#c084fc"]);

export function renderBanner(): void {
  const ascii = figlet.textSync("NOAH", {
    font: "ANSI Shadow",
    horizontalLayout: "default",
    verticalLayout: "default",
  });

  console.log();
  console.log(noahGradient.multiline(ascii));
  console.log(chalk.bold.white("  NOAH CURSOR"));
  console.log(chalk.dim("  Package Manager for Cursor Assets"));
  console.log();
}
