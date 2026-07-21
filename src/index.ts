#!/usr/bin/env node
import { createProgram } from "./core/program.js";
import { renderBanner } from "./ui/banner.js";

async function main(): Promise<void> {
  const program = createProgram();
  const args = process.argv.slice(2);

  // No arguments: show branding + help, exit successfully (not an error)
  if (args.length === 0) {
    renderBanner(true);
    program.outputHelp();
    return;
  }

  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
