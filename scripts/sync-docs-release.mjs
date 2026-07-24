#!/usr/bin/env node
/**
 * Sync GitHub Pages docs with the current package version.
 * Used by /publish-npm after `npm version patch`.
 *
 * Usage:
 *   node scripts/sync-docs-release.mjs
 *   node scripts/sync-docs-release.mjs --title "Title" --summary "..." --note "Bullet" --note "Bullet"
 *   node scripts/sync-docs-release.mjs --label "First public" --label-tone public
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagePath = path.join(root, "package.json");
const releasesPath = path.join(root, "docs", "releases.json");
const indexPath = path.join(root, "docs", "index.html");

function parseArgs(argv) {
  const out = {
    title: null,
    summary: null,
    notes: [],
    labels: [],
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--title") out.title = argv[++i];
    else if (arg === "--summary") out.summary = argv[++i];
    else if (arg === "--note") out.notes.push(argv[++i]);
    else if (arg === "--label") {
      const text = argv[++i];
      const next = argv[i + 1];
      let tone = "default";
      if (next === "--label-tone") {
        tone = argv[i + 2];
        i += 2;
      }
      out.labels.push({ text, tone });
    } else if (arg === "--label-tone") {
      // handled with --label
      i += 1;
    }
  }

  return out;
}

function run(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function notesFromGit(version) {
  const prev = run(`git describe --tags --abbrev=0 --match 'v*' HEAD^ 2>/dev/null`);
  const range = prev ? `${prev}..HEAD` : "HEAD~15..HEAD";
  const log = run(`git log --pretty=format:%s ${range}`);
  const lines = log
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^(\d+\.){2}\d+$/.test(l))
    .filter((l) => !l.startsWith(version))
    .slice(0, 8);

  return lines.length ? lines : [`Release ${version}`];
}

function updateIndexSoftwareVersion(html, version) {
  if (html.includes('"softwareVersion"')) {
    return html.replace(
      /"softwareVersion"\s*:\s*"[^"]*"/,
      `"softwareVersion": "${version}"`,
    );
  }
  return html;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const version = pkg.version;

  if (!version) {
    console.error("package.json has no version");
    process.exit(1);
  }

  const releasesDoc = JSON.parse(fs.readFileSync(releasesPath, "utf8"));
  const existing = Array.isArray(releasesDoc.releases) ? releasesDoc.releases : [];

  if (existing.some((r) => r.version === version)) {
    console.log(`docs/releases.json already has v${version} — updating latest only`);
    releasesDoc.latest = version;
  } else {
    const entry = {
      version,
      date: todayIso(),
      tag: `v${version}`,
      title: args.title || `Release ${version}`,
      summary:
        args.summary ||
        `npm release ${version} of the Noah Cursor CLI and bundled registry.`,
      notes: args.notes.length ? args.notes : notesFromGit(version),
    };

    if (args.labels.length) {
      entry.labels = args.labels;
    }

    releasesDoc.latest = version;
    releasesDoc.releases = [entry, ...existing];
  }

  if (!releasesDoc.minVersion) {
    releasesDoc.minVersion = "1.5.7";
  }

  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const nextIndex = updateIndexSoftwareVersion(indexHtml, version);

  if (args.dryRun) {
    console.log(JSON.stringify({ version, release: releasesDoc.releases[0] }, null, 2));
    return;
  }

  fs.writeFileSync(releasesPath, `${JSON.stringify(releasesDoc, null, 2)}\n`);
  if (nextIndex !== indexHtml) {
    fs.writeFileSync(indexPath, nextIndex);
  }

  console.log(`Synced GitHub Pages docs for noah-cursor@${version}`);
  console.log(`- updated ${path.relative(root, releasesPath)}`);
  if (nextIndex !== indexHtml) {
    console.log(`- updated softwareVersion in ${path.relative(root, indexPath)}`);
  }
}

main();
