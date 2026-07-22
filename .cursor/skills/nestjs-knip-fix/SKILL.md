---
name: nestjs-knip-fix
description: >-
  Runs Knip on NestJS projects, constructs fixes for unused files, exports, and
  dependencies, and verifies that implementations, features, and functionalities
  are not broken after changes. Use when the user runs /nestjs-knip-fix, asks
  to run knip on NestJS, clean up unused NestJS code, or fix Knip findings
  without regressions.
disable-model-invocation: true
---

# /nestjs-knip-fix

Run **`npx knip`** on a **NestJS** app, fix **all** findings, and prove behavior still works.

Do **not** stop after the first issue type. Do **not** mass-ignore. Prefer root-cause removals and export cleanups. After every batch of edits, re-verify so implementations, features, and functionalities are not broken.

## Workflow

Copy this checklist and track progress:

```
NestJS Knip Fix Progress:
- [ ] 1. Confirm NestJS project + verification commands
- [ ] 2. Ensure Knip config (Nest-aware)
- [ ] 3. Baseline knip scan
- [ ] 4. Triage findings (priority order)
- [ ] 5. Fix in batches (explain → edit → verify)
- [ ] 6. Re-scan until clean (or document intentional leftovers)
- [ ] 7. Final verification + report
```

### 1. Confirm NestJS project + verification commands

From the project root:

1. Confirm NestJS (`@nestjs/core` in `package.json`, usually `nest-cli.json` / `src/main.ts`) — abort if not.
2. Detect verification commands (prefer existing scripts):

```bash
npm test                 # or pnpm / yarn / bun
npm run test:e2e
npm run build            # nest build / tsc
npm run lint
npx tsc --noEmit
```

Record the chosen commands before editing.

### 2. Ensure Knip config (Nest-aware)

If the project has no `knip.json` / `knip.ts` / `knip` field in `package.json`, copy the skill template into the project root as `knip.json`:

- Template: [`config/knip.nestjs.json`](config/knip.nestjs.json)

Adjust `entry` / `project` for monorepos (`apps/*`, `libs/*`) when needed. Prefer extending the template over inventing a blank config.

Do not overwrite an existing Knip config unless the user asks — merge Nest entry patterns into the existing config instead.

### 3. Baseline knip scan

```bash
npx knip --no-progress
```

If a local config path is required:

```bash
npx knip --config knip.json --no-progress
```

Optional production-only pass (after the default scan is clean or when the user asks):

```bash
npx knip --production --no-progress
```

Capture output for triage. Default for this skill is a **full** workspace scan unless the user scopes it.

### 4. Triage findings

Work findings in this priority:

1. **Unused dependencies / devDependencies** — remove from `package.json` only after confirming Nest/CLI/plugins do not need them
2. **Unlisted dependencies** — add the real import to `dependencies` / `devDependencies` (do not rely on transitive deps)
3. **Unused files** — delete only when not dynamically loaded (`i18n`, `assets`, `path.join(__dirname, …)`, Nest schematics paths)
4. **Unused exports** — remove `export` or delete dead symbols; keep Nest decorators’ public APIs (`@Module` providers/controllers/imports that Knip misunderstands → fix config, don’t gut the module)
5. **Duplicate / enum / namespace export noise** — resolve carefully; suppress only as last resort

**NestJS cautions**

- Controllers, providers, guards, interceptors, pipes, filters registered only via module metadata must stay reachable from entry modules — if Knip says unused, verify `*.module.ts` wiring first.
- Do not remove `main.ts`, `app.module.ts`, or Nest CLI schematics entrypoints.
- Spec / e2e files: prefer config `ignore` / project patterns over deleting tests.

### 5. Fix in batches (explain → edit → verify)

For each batch:

1. **Explain** what Knip reported and why the change is safe.
2. **Edit** the minimum (package.json, exports, delete files).
3. **Verify** with build + unit tests (and e2e when relevant).
4. If verification fails: **revert or repair** before continuing.

#### Fix construction rules

- Preserve HTTP routes, DTO contracts, swagger models, queues, cron jobs, and microservice patterns.
- Prefer removing unused exports over deleting whole Nest providers that are still registered.
- Run `npm install` / lockfile update after dependency changes.
- Keep diffs small. No drive-by refactors.

#### Ignores (last resort)

Use Knip `ignore`, `ignoreDependencies`, or `ignoreBinaries` only for true false positives (Nest dynamic modules, intentional public SDK barrels). Document each ignore in the final report.

### 6. Re-scan until clean

```bash
npx knip --no-progress
```

Repeat until exit 0 or only approved ignores remain.

### 7. Final verification + report

```markdown
## NestJS Knip fix report

### Scan
- Baseline: <summary>
- Final: <clean | remaining>

### Fixed
- <issue type> — <what changed>

### Ignores / config
- none | <item> — reason

### Verification
- <command> — pass/fail
```

## Safety

- Do not commit or push unless the user asks.
- Do not delete `.env` or secrets.
- Stop and ask before removing large feature modules or public API packages.
