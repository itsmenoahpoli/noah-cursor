---
name: node-doctor-fix
description: >-
  Runs the bundled node-doctor tool (Knip + package hygiene) on generic Node.js
  projects, constructs fixes for all findings, and verifies that implementations,
  features, and functionalities are not broken after changes. Use when the user
  runs /node-doctor-fix, asks to doctor a Node.js package/CLI, clean unused
  Node exports/deps, or fix node-doctor findings without regressions.
disable-model-invocation: true
---

# /node-doctor-fix

Run the bundled **`node-doctor`** tool on a **generic Node.js** project (library, CLI, or service — not Nest/Next-first apps), fix **all** findings, and prove behavior still works.

`node-doctor` = **Knip** (unused files / exports / dependencies) using [`config/node-doctor.knip.json`](config/node-doctor.knip.json) when the project has no Knip config, **plus** package hygiene checks (`bin` / `main` / `exports` / script paths / `engines.node`).

Do **not** mass-ignore. Prefer root-cause fixes. After every batch of edits, re-verify so implementations, features, and functionalities are not broken.

## Workflow

Copy this checklist and track progress:

```
Node Doctor Fix Progress:
- [ ] 1. Confirm Node project + route frameworks elsewhere
- [ ] 2. Baseline node-doctor scan
- [ ] 3. Triage findings (priority order)
- [ ] 4. Fix in batches (explain → edit → verify)
- [ ] 5. Re-scan until clean (or document intentional leftovers)
- [ ] 6. Final verification + report
```

### 1. Confirm Node project + route frameworks elsewhere

From the project root:

1. Confirm `package.json` exists.
2. If the app is primarily **NestJS** → use `/nestjs-knip-fix` instead.
3. If the app is primarily **React** → use `/react-doctor-fix` (optionally Knip later).
4. Detect verification commands:

```bash
npm test
npm run typecheck   # or npx tsc --noEmit
npm run lint
npm run build
node ./dist/index.js --help   # CLIs when applicable
```

### 2. Baseline node-doctor scan

Resolve the skill directory (installed under `.cursor/skills/node-doctor-fix` or this registry path), then:

```bash
node <skillDir>/scripts/node-doctor.mjs . --json > .node-doctor-baseline.json
node <skillDir>/scripts/node-doctor.mjs .
```

Examples:

```bash
node .cursor/skills/node-doctor-fix/scripts/node-doctor.mjs .
node skills/node-doctor-fix/scripts/node-doctor.mjs .
```

Flags:

- `--json` — machine-readable findings
- `--knip-only` — skip package hygiene
- `--hygiene-only` — skip Knip

If the project already has `knip.json` / `package.json#knip`, node-doctor uses that for Knip; otherwise it uses the bundled [`config/node-doctor.knip.json`](config/node-doctor.knip.json).

Delete temporary report files before finishing (or keep them untracked).

### 3. Triage findings

Priority:

1. **Broken package entrypoints** — missing `bin` / `main` / `exports` / script paths (hygiene errors)
2. **Unlisted dependencies** — add real imports to package.json
3. **Unused dependencies** — remove only when not required by tooling/config plugins
4. **Unused files** — delete when not dynamically required
5. **Unused exports / types** — remove or stop exporting
6. **Hygiene warnings** — e.g. missing `engines.node`

### 4. Fix in batches (explain → edit → verify)

For each batch:

1. **Explain** the finding and why the fix is safe.
2. **Edit** minimally (`package.json`, exports, delete dead files).
3. **Verify** with test / typecheck / build / CLI smoke.
4. On failure: **revert or repair** before continuing.

#### Fix construction rules

- Preserve public package API (`exports`, documented CLI flags, published bin names).
- Do not remove files loaded dynamically (`fs.readFile`, runtime plugin paths) without proof.
- Update the lockfile after dependency changes.
- Do not convert the project into Nest/Next-specific structure.

#### Ignores (last resort)

Prefer fixing. If Knip false-positives remain, add narrow `ignore` / `ignoreDependencies` to the **project** Knip config (create one from the bundled config rather than silencing the tool). Document every ignore.

### 5. Re-scan until clean

```bash
node <skillDir>/scripts/node-doctor.mjs .
```

Exit code must be `0` (or only approved documented leftovers remain).

### 6. Final verification + report

```markdown
## Node doctor fix report

### Scan
- Baseline: <N findings>
- Final: <clean | N remaining>

### Fixed
- <type> — summary

### Ignores / config
- none | item — reason

### Verification
- <command> — pass/fail
```

## Tool reference

| Path | Role |
|------|------|
| `scripts/node-doctor.mjs` | CLI analyser |
| `config/node-doctor.knip.json` | Default Knip config for generic Node |

## Safety

- Do not commit or push unless the user asks.
- Do not commit secrets.
- Stop and ask before deleting public API surface or major packages.
