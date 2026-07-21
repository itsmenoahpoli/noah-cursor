import chalk from "chalk";

export function humanizeId(id: string): string {
  return id
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatAssetLabel(id: string, description?: string): string {
  const title = humanizeId(id);
  if (!description) {
    return title;
  }
  const truncated =
    description.length > 60 ? `${description.slice(0, 57)}…` : description;
  return `${title}${chalk.dim(` — ${truncated}`)}`;
}

export function printDivider(): void {
  console.log(chalk.dim("────────────────────────────"));
}

export function printHint(lines: string[]): void {
  printDivider();
  for (const line of lines) {
    console.log(chalk.dim(line));
  }
}
