import path from "node:path";
import fs from "fs-extra";
import type {
  HealthScores,
  ProjectAnalysis,
  ProjectStack,
  SearchResult,
} from "../types/index.js";
import { listRegistryAssets } from "./install-service.js";
import { listInstalledAssets } from "../metadata/store.js";
import { DEFAULT_IDE, type IdeId } from "../constants/index.js";

async function fileExists(cwd: string, rel: string): Promise<boolean> {
  return fs.pathExists(path.join(cwd, rel));
}

async function readJsonSafe(cwd: string, rel: string): Promise<Record<string, unknown> | null> {
  try {
    return (await fs.readJson(path.join(cwd, rel))) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function detectProjectStack(cwd = process.cwd()): Promise<ProjectStack> {
  const frameworks: string[] = [];
  const languages: string[] = [];
  const tools: string[] = [];
  const packageManagers: string[] = [];

  const pkg = await readJsonSafe(cwd, "package.json");
  const composer = await readJsonSafe(cwd, "composer.json");
  const deps = {
    ...(typeof pkg?.dependencies === "object" && pkg.dependencies
      ? (pkg.dependencies as Record<string, string>)
      : {}),
    ...(typeof pkg?.devDependencies === "object" && pkg.devDependencies
      ? (pkg.devDependencies as Record<string, string>)
      : {}),
  };

  if (pkg) {
    languages.push("JavaScript/TypeScript");
    if (await fileExists(cwd, "pnpm-lock.yaml")) packageManagers.push("pnpm");
    else if (await fileExists(cwd, "yarn.lock")) packageManagers.push("yarn");
    else if (await fileExists(cwd, "package-lock.json")) packageManagers.push("npm");
  }

  if (composer) {
    languages.push("PHP");
    packageManagers.push("composer");
    const require = (composer.require ?? {}) as Record<string, string>;
    if (require["laravel/framework"] || (await fileExists(cwd, "artisan"))) {
      frameworks.push("Laravel");
    }
  }

  if (deps.next || deps["@next/core"] || (await fileExists(cwd, "next.config.js")) || (await fileExists(cwd, "next.config.ts"))) {
    frameworks.push("Next.js");
  }
  if (deps.nuxt || (await fileExists(cwd, "nuxt.config.ts")) || (await fileExists(cwd, "nuxt.config.js"))) {
    frameworks.push("Nuxt");
  }
  if (deps.vue || deps["@vue/runtime-core"]) frameworks.push("Vue");
  if (deps.react || deps["react-dom"]) frameworks.push("React");
  if (deps["@nestjs/core"]) frameworks.push("NestJS");
  if (deps.tailwindcss) frameworks.push("Tailwind");
  if (deps.prisma || deps["@prisma/client"] || (await fileExists(cwd, "prisma/schema.prisma"))) {
    frameworks.push("Prisma");
  }

  if (await fileExists(cwd, "Dockerfile") || (await fileExists(cwd, "docker-compose.yml"))) {
    tools.push("Docker");
  }
  if (await fileExists(cwd, ".github/workflows")) tools.push("GitHub Actions");
  if (await fileExists(cwd, ".gitlab-ci.yml")) tools.push("GitLab CI");
  if (await fileExists(cwd, "railway.toml") || (await fileExists(cwd, "railway.json"))) {
    tools.push("Railway");
  }
  if (await fileExists(cwd, ".git")) tools.push("Git");

  for (const ideDir of [".cursor", ".claude", ".windsurf", ".continue", ".cline"]) {
    if (await fileExists(cwd, ideDir)) tools.push(`AI config (${ideDir})`);
  }

  return {
    frameworks: [...new Set(frameworks)],
    languages: [...new Set(languages)],
    tools: [...new Set(tools)],
    packageManagers: [...new Set(packageManagers)],
  };
}

function scoreFromPresence(present: boolean, weight = 20): number {
  return present ? weight : 0;
}

export async function computeHealthScores(
  cwd = process.cwd(),
  ide: IdeId = DEFAULT_IDE,
): Promise<HealthScores> {
  const stack = await detectProjectStack(cwd);
  const installed = await listInstalledAssets(cwd, ide);
  const hasTests =
    (await fileExists(cwd, "tests")) ||
    (await fileExists(cwd, "__tests__")) ||
    (await fileExists(cwd, "src/tests")) ||
    installed.installed.some((a) => a.id.includes("test") || a.id.includes("qa"));
  const hasDocs =
    (await fileExists(cwd, "README.md")) ||
    (await fileExists(cwd, "docs")) ||
    installed.installed.some((a) => a.id.includes("readme") || a.id.includes("docs"));
  const hasSecurity =
    installed.installed.some((a) => a.id.includes("security")) ||
    (await fileExists(cwd, ".env.example"));
  const hasArchitecture =
    stack.frameworks.length > 0 ||
    installed.installed.some((a) => a.id.includes("architecture") || a.id.includes("api"));

  const architecture = Math.min(
    10,
    (scoreFromPresence(stack.frameworks.length > 0, 4) +
      scoreFromPresence(hasArchitecture, 3) +
      scoreFromPresence(stack.tools.includes("Docker"), 1.5) +
      scoreFromPresence(installed.installed.length > 0, 1.5)) /
      1,
  );
  const security = Math.min(
    10,
    (scoreFromPresence(hasSecurity, 4) +
      scoreFromPresence(await fileExists(cwd, ".gitignore"), 2) +
      scoreFromPresence(!(await fileExists(cwd, ".env")), 2) +
      scoreFromPresence(stack.tools.some((t) => t.includes("CI")), 2)) /
      1,
  );
  const documentation = Math.min(
    10,
    (scoreFromPresence(hasDocs, 5) +
      scoreFromPresence(await fileExists(cwd, "LICENSE"), 2) +
      scoreFromPresence(installed.installed.some((a) => a.id.includes("readme")), 3)) /
      1,
  );
  const testing = Math.min(
    10,
    (scoreFromPresence(hasTests, 5) +
      scoreFromPresence(
        installed.installed.some(
          (a) => a.id.includes("test") || a.id.includes("doctor") || a.id.includes("fix"),
        ),
        3,
      ) +
      scoreFromPresence(await fileExists(cwd, "vitest.config.ts") || await fileExists(cwd, "jest.config.js"), 2)) /
      1,
  );

  const round = (n: number) => Math.round(n * 10) / 10;
  const scores = {
    architecture: round(architecture),
    security: round(security),
    documentation: round(documentation),
    testing: round(testing),
    overall: 0,
  };
  scores.overall = round(
    (scores.architecture + scores.security + scores.documentation + scores.testing) / 4,
  );
  return scores;
}

const TAG_HINTS: Record<string, string[]> = {
  Laravel: ["laravel", "php", "api"],
  React: ["react", "spa", "dashboard"],
  "Next.js": ["nextjs", "marketing", "seo"],
  Nuxt: ["nuxt", "vue", "marketing"],
  Vue: ["vue", "nuxt"],
  NestJS: ["nestjs", "node", "typescript"],
  Prisma: ["prisma"],
  Docker: ["docker"],
  Tailwind: ["tailwind"],
};

export async function recommendPackages(
  cwd = process.cwd(),
  options: { verbose?: boolean; limit?: number } = {},
): Promise<SearchResult[]> {
  const stack = await detectProjectStack(cwd);
  const registry = await listRegistryAssets(undefined, { verbose: options.verbose });
  const wantedTags = new Set<string>();
  for (const fw of [...stack.frameworks, ...stack.tools]) {
    for (const tag of TAG_HINTS[fw] ?? [fw.toLowerCase()]) {
      wantedTags.add(tag);
    }
  }
  // Always useful baselines
  for (const tag of ["git", "docs", "architecture", "qa"]) wantedTags.add(tag);

  const scored = registry.assets
    .map((asset) => {
      const tags = asset.tags ?? [];
      let score = 0;
      for (const tag of tags) {
        if (wantedTags.has(tag.toLowerCase())) score += 10;
      }
      for (const fw of stack.frameworks) {
        if (asset.id.toLowerCase().includes(fw.toLowerCase().replace(/\./g, ""))) score += 20;
        if (asset.description?.toLowerCase().includes(fw.toLowerCase())) score += 5;
      }
      return { ...asset, score };
    })
    .filter((a) => (a.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return scored.slice(0, options.limit ?? 8);
}

export async function analyzeProject(
  cwd = process.cwd(),
  ide: IdeId = DEFAULT_IDE,
  options: { verbose?: boolean } = {},
): Promise<ProjectAnalysis> {
  const stack = await detectProjectStack(cwd);
  const health = await computeHealthScores(cwd, ide);
  const recommendations = await recommendPackages(cwd, options);
  const installed = await listInstalledAssets(cwd, ide);
  const installedIds = new Set(installed.installed.map((a) => `${a.type}:${a.id}`));

  const missing: string[] = [];
  if (health.testing < 5) missing.push("Testing");
  if (health.documentation < 5) missing.push("Documentation");
  if (health.security < 5) missing.push("Security");
  if (health.architecture < 5) missing.push("Architecture");

  return {
    stack,
    health,
    missing,
    recommendations: recommendations.filter((r) => !installedIds.has(`${r.type}:${r.id}`)),
  };
}
