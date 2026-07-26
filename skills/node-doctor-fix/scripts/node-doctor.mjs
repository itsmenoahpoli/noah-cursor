#!/usr/bin/env node
/**
 * node-doctor — analyse a generic Node.js project.
 *
 * Combines:
 *  1) Knip (unused files / exports / dependencies) using the bundled config
 *  2) Package hygiene checks (bin/main/exports/scripts paths, engines)
 *
 * Usage:
 *   node scripts/node-doctor.mjs [projectDir] [--json] [--knip-only] [--hygiene-only]
 *
 * Exit codes: 0 clean, 1 findings, 2 usage/setup error
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_KNIP_CONFIG = path.resolve(
  __dirname,
  "../config/node-doctor.knip.json",
);

function parseArgs(argv) {
  const opts = {
    dir: process.cwd(),
    json: false,
    knipOnly: false,
    hygieneOnly: false,
  };

  for (const arg of argv) {
    if (arg === "--json") opts.json = true;
    else if (arg === "--knip-only") opts.knipOnly = true;
    else if (arg === "--hygiene-only") opts.hygieneOnly = true;
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg.startsWith("-")) {
      throw new Error(`Unknown flag: ${arg}`);
    } else opts.dir = path.resolve(arg);
  }

  return opts;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function exists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function isNodeProject(dir) {
  return exists(path.join(dir, "package.json"));
}

function looksLikeFrameworkProject(pkg) {
  const all = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  };
  const keys = Object.keys(all ?? {});
  return {
    nest: keys.some((k) => k.startsWith("@nestjs/")),
    next: keys.includes("next"),
    react: keys.includes("react") && !keys.includes("next"),
    laravelHint: false,
  };
}

/** Resolve package.json "exports" / "bin" / "main" targets to filesystem paths. */
function collectPackagePaths(pkg, dir) {
  const targets = [];

  const add = (rel, kind, label) => {
    if (!rel || typeof rel !== "string") return;
    if (rel.startsWith("http:") || rel.startsWith("https:") || rel.startsWith("node:")) {
      return;
    }
    const cleaned = rel.replace(/^\.\//, "");
    targets.push({ kind, label, rel: cleaned, abs: path.join(dir, cleaned) });
  };

  if (pkg.main) add(pkg.main, "main", "main");
  if (pkg.module) add(pkg.module, "module", "module");
  if (pkg.types) add(pkg.types, "types", "types");
  if (pkg.typings) add(pkg.typings, "types", "typings");

  if (typeof pkg.bin === "string") add(pkg.bin, "bin", "bin");
  else if (pkg.bin && typeof pkg.bin === "object") {
    for (const [name, rel] of Object.entries(pkg.bin)) {
      add(rel, "bin", `bin.${name}`);
    }
  }

  const walkExports = (value, label) => {
    if (!value) return;
    if (typeof value === "string") add(value, "exports", label);
    else if (typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        walkExports(v, `${label}.${k}`);
      }
    }
  };
  walkExports(pkg.exports, "exports");

  return targets;
}

function scriptLocalRefs(script) {
  if (typeof script !== "string") return [];
  const refs = [];
  const patterns = [
    /\bnode\s+([./][^\s]+)/g,
    /\bts-node\s+([./][^\s]+)/g,
    /\btsx\s+([./][^\s]+)/g,
    /\bsh\s+([./][^\s]+)/g,
    /\bbash\s+([./][^\s]+)/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(script)) !== null) {
      refs.push(m[1]);
    }
  }
  return refs;
}

function runHygiene(dir, pkg) {
  const findings = [];

  if (!pkg.name) {
    findings.push({
      type: "package-hygiene",
      severity: "error",
      message: 'package.json is missing "name"',
      file: "package.json",
    });
  }
  if (!pkg.version) {
    findings.push({
      type: "package-hygiene",
      severity: "error",
      message: 'package.json is missing "version"',
      file: "package.json",
    });
  }

  if (!pkg.engines?.node) {
    findings.push({
      type: "package-hygiene",
      severity: "warning",
      message: 'package.json is missing "engines.node" (recommended for Node libraries/CLIs)',
      file: "package.json",
    });
  }

  for (const target of collectPackagePaths(pkg, dir)) {
    if (!exists(target.abs)) {
      findings.push({
        type: "package-hygiene",
        severity: "error",
        message: `${target.label} points to missing file: ${target.rel}`,
        file: "package.json",
      });
    }
  }

  if (pkg.scripts && typeof pkg.scripts === "object") {
    for (const [name, script] of Object.entries(pkg.scripts)) {
      for (const ref of scriptLocalRefs(script)) {
        const abs = path.resolve(dir, ref);
        if (!exists(abs)) {
          findings.push({
            type: "package-hygiene",
            severity: "error",
            message: `scripts.${name} references missing file: ${ref}`,
            file: "package.json",
          });
        }
      }
    }
  }

  return findings;
}

function runKnip(dir) {
  if (!exists(DEFAULT_KNIP_CONFIG)) {
    return {
      ok: false,
      findings: [
        {
          type: "setup",
          severity: "error",
          message: `Bundled Knip config missing: ${DEFAULT_KNIP_CONFIG}`,
        },
      ],
      raw: "",
    };
  }

  // Prefer project knip config when present; otherwise use bundled Node defaults.
  const projectConfigs = ["knip.json", "knip.jsonc", "knip.ts", "knip.config.ts"];
  const hasProjectConfig = projectConfigs.some((f) => exists(path.join(dir, f))) ||
    (() => {
      try {
        const pkg = readJson(path.join(dir, "package.json"));
        return Boolean(pkg.knip);
      } catch {
        return false;
      }
    })();

  // Pin major to avoid surprise supply-chain pulls from floating `knip`.
  const args = ["knip@5", "--no-progress", "--reporter", "json"];
  if (!hasProjectConfig) {
    args.push("--config", DEFAULT_KNIP_CONFIG);
  }

  const result = spawnSync("npx", args, {
    cwd: dir,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: process.env,
  });

  const raw = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  const findings = [];

  // Knip JSON reporter may print a JSON object or array; also tolerate text fallback.
  try {
    const parsed = JSON.parse(result.stdout || "null");
    if (parsed && typeof parsed === "object") {
      const pushIssue = (type, items) => {
        if (!Array.isArray(items)) return;
        for (const item of items) {
          const file = item.file ?? item.name ?? item.path ?? undefined;
          const name = item.name ?? item.symbol ?? item.identifier;
          findings.push({
            type,
            severity: "error",
            message: name ? `${type}: ${name}` : String(type),
            file,
            raw: item,
          });
        }
      };

      // Shape varies by knip version — handle common keys.
      pushIssue("unused-files", parsed.files);
      pushIssue("unused-dependencies", parsed.dependencies);
      pushIssue("unused-devDependencies", parsed.devDependencies);
      pushIssue("unlisted-dependencies", parsed.unlisted);
      pushIssue("unused-exports", parsed.exports);
      pushIssue("unused-types", parsed.types);
      pushIssue("unused-duplicates", parsed.duplicates);
      pushIssue("unused-enumMembers", parsed.enumMembers);
      pushIssue("unused-namespaceMembers", parsed.nsExports ?? parsed.nsTypes);
      pushIssue("unused-binaries", parsed.binaries);

      if (Array.isArray(parsed.issues)) {
        for (const issue of parsed.issues) {
          findings.push({
            type: issue.type ?? "knip",
            severity: "error",
            message: issue.message ?? JSON.stringify(issue),
            file: issue.file,
            raw: issue,
          });
        }
      }
    }
  } catch {
    if (result.status && result.status !== 0 && raw) {
      findings.push({
        type: "knip",
        severity: "error",
        message: "Knip reported issues (see raw output)",
        raw,
      });
    }
  }

  // If JSON parse yielded nothing but knip failed, surface stdout/stderr.
  if (findings.length === 0 && result.status && result.status !== 0) {
    findings.push({
      type: "knip",
      severity: "error",
      message: raw || `knip exited with code ${result.status}`,
    });
  }

  return { ok: result.status === 0 && findings.length === 0, findings, raw, status: result.status };
}

function printHuman(findings, knipRaw) {
  if (findings.length === 0) {
    console.log("node-doctor: clean — no findings");
    return;
  }

  console.log(`node-doctor: ${findings.length} finding(s)\n`);
  const byType = new Map();
  for (const f of findings) {
    const list = byType.get(f.type) ?? [];
    list.push(f);
    byType.set(f.type, list);
  }

  for (const [type, list] of byType) {
    console.log(`${type} (${list.length})`);
    for (const f of list) {
      const loc = f.file ? ` ${f.file}` : "";
      console.log(`  - [${f.severity}]${loc} ${f.message}`);
    }
    console.log();
  }

  if (knipRaw && findings.some((f) => f.type === "knip" && f.raw === knipRaw)) {
    console.log("knip raw output:\n" + knipRaw);
  }
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(String(error instanceof Error ? error.message : error));
    process.exit(2);
  }

  if (opts.help) {
    console.log(`Usage: node-doctor.mjs [projectDir] [--json] [--knip-only] [--hygiene-only]`);
    process.exit(0);
  }

  const dir = opts.dir;
  if (!isNodeProject(dir)) {
    console.error(`Not a Node.js project (package.json missing): ${dir}`);
    process.exit(2);
  }

  const pkg = readJson(path.join(dir, "package.json"));
  const frameworks = looksLikeFrameworkProject(pkg);
  if (frameworks.nest) {
    console.error(
      "This looks like a NestJS project. Use /nestjs-knip-fix (npx knip) instead of node-doctor.",
    );
    process.exit(2);
  }

  const findings = [];
  let knipRaw = "";

  if (!opts.hygieneOnly) {
    const knip = runKnip(dir);
    knipRaw = knip.raw;
    findings.push(...knip.findings);
  }

  if (!opts.knipOnly) {
    findings.push(...runHygiene(dir, pkg));
  }

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          tool: "node-doctor",
          cwd: dir,
          findingCount: findings.length,
          findings,
        },
        null,
        2,
      ),
    );
  } else {
    printHuman(findings, knipRaw);
  }

  process.exit(findings.length === 0 ? 0 : 1);
}

main();
