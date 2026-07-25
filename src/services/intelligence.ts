import { select, confirm } from "@inquirer/prompts";
import { logInfo, logSuccess, logTitle } from "../core/logger.js";
import { DEFAULT_IDE, type IdeId } from "../constants/index.js";
import type { InstallResult, SearchResult } from "../types/index.js";
import { humanizeId } from "../ui/format.js";
import {
  getPackagePreview,
  installByPackageNames,
  listRegistryAssets,
  updateAssets,
} from "./install-service.js";
import { analyzeProject, detectProjectStack, recommendPackages } from "./project-awareness.js";
import { listInstalledAssets } from "../metadata/store.js";

export async function explainPackage(
  input: string,
  options: { verbose?: boolean } = {},
): Promise<SearchResult> {
  return getPackagePreview(input, options);
}

export function formatExplanation(pkg: SearchResult): string[] {
  const lines = [
    `${humanizeId(pkg.id)}`,
    "",
    `Type: ${pkg.type}`,
    `Version: ${pkg.version}`,
  ];
  if (pkg.verified) lines.push("Status: ✓ Verified");
  if (pkg.author) lines.push(`Author: ${pkg.author}`);
  if (pkg.rating != null) lines.push(`Rating: ${"★".repeat(Math.round(pkg.rating))}${"☆".repeat(5 - Math.round(pkg.rating))} (${pkg.rating})`);
  if (pkg.downloads != null) lines.push(`Downloads: ${pkg.downloads.toLocaleString()}`);
  if (pkg.description) {
    lines.push("", "Purpose", pkg.description);
  }
  if (pkg.tags?.length) {
    lines.push("", `Tags: ${pkg.tags.join(", ")}`);
  }
  if (pkg.dependsOn?.length) {
    lines.push("", `Depends on: ${pkg.dependsOn.join(", ")}`);
  }
  if (pkg.changelog) {
    lines.push("", "What's new", pkg.changelog);
  }
  lines.push(
    "",
    "Benefits",
    `- Applies curated ${pkg.type} guidance to your AI coding assistant`,
    `- Keeps project conventions consistent across the team`,
    `- Install with: noah-cursor install ${pkg.type}/${pkg.id}`,
  );
  return lines;
}

export async function runSetupWizard(
  options: { yes?: boolean; dryRun?: boolean; verbose?: boolean; ide?: IdeId } = {},
): Promise<InstallResult[]> {
  const projectType = await select({
    message: "What are you building?",
    choices: [
      { name: "API", value: "api" },
      { name: "Website / Marketing", value: "website" },
      { name: "Microservice", value: "microservice" },
      { name: "CLI", value: "cli" },
      { name: "SaaS", value: "saas" },
      { name: "Detect from project", value: "detect" },
    ],
  });

  let framework = "detect";
  if (projectType !== "detect") {
    framework = await select({
      message: "Primary framework?",
      choices: [
        { name: "Laravel", value: "laravel" },
        { name: "React", value: "react" },
        { name: "Next.js", value: "nextjs" },
        { name: "Vue / Nuxt", value: "nuxt" },
        { name: "NestJS", value: "nestjs" },
        { name: "Node / generic", value: "node" },
        { name: "Auto-detect", value: "detect" },
      ],
    });
  }

  const stack = await detectProjectStack();
  const recommendations = await recommendPackages(process.cwd(), { limit: 10 });

  const frameworkHint = framework === "detect" ? stack.frameworks[0]?.toLowerCase() : framework;
  const filtered = recommendations.filter((r) => {
    if (!frameworkHint) return true;
    const hay = `${r.id} ${(r.tags ?? []).join(" ")} ${r.description ?? ""}`.toLowerCase();
    return hay.includes(frameworkHint) || hay.includes("git") || hay.includes("docs") || hay.includes("architecture");
  });

  const picks = (filtered.length > 0 ? filtered : recommendations).slice(0, 5);
  logTitle("Recommended packages");
  for (const p of picks) {
    console.log(`  • ${p.type}/${p.id} — ${p.description ?? ""}`);
  }

  const ok =
    options.yes ||
    (await confirm({
      message: `Install ${picks.length} recommended package(s)?`,
      default: true,
    }));

  if (!ok) {
    logInfo("Setup cancelled.");
    return [];
  }

  return installByPackageNames(
    picks.map((p) => `${p.type}/${p.id}`),
    {
      ide: options.ide ?? DEFAULT_IDE,
      yes: true,
      dryRun: options.dryRun,
      verbose: options.verbose,
    },
  );
}

export async function runUpgradeAssistant(
  options: { yes?: boolean; dryRun?: boolean; verbose?: boolean; ide?: IdeId } = {},
): Promise<InstallResult[]> {
  const ide = options.ide ?? DEFAULT_IDE;
  const stack = await detectProjectStack();
  const installed = await listInstalledAssets(process.cwd(), ide);
  const registry = await listRegistryAssets(undefined, { verbose: options.verbose });

  const outdated: string[] = [];
  for (const asset of installed.installed) {
    const latest = registry.assets.find((a) => a.type === asset.type && a.id === asset.id);
    if (latest && latest.version !== asset.version && asset.version !== "local") {
      outdated.push(`${asset.type}/${asset.id} ${asset.version} → ${latest.version}`);
    }
  }

  if (stack.frameworks.includes("Laravel")) {
    logInfo("Laravel detected — related packages can be refreshed.");
  }

  if (outdated.length === 0 && installed.installed.length === 0) {
    logInfo("Nothing to upgrade. Install packages first or run bootstrap.");
    return [];
  }

  if (outdated.length > 0) {
    logTitle("Upgrades available");
    for (const line of outdated) console.log(`  ${line}`);
  } else {
    logInfo("Installed packages match registry versions. Reinstalling to refresh files…");
  }

  const ok =
    options.yes ||
    (await confirm({
      message: "Update related packages?",
      default: true,
    }));

  if (!ok) {
    logInfo("Upgrade cancelled.");
    return [];
  }

  const results = await updateAssets({
    yes: true,
    dryRun: options.dryRun,
    verbose: options.verbose,
    ide,
  });
  logSuccess("Upgrade assistant finished.");
  return results;
}

export async function runAnalyze(ide: IdeId = DEFAULT_IDE, verbose?: boolean) {
  return analyzeProject(process.cwd(), ide, { verbose });
}
