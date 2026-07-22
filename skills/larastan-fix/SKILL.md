---
name: larastan-fix
description: >-
  Runs Larastan (PHPStan for Laravel), constructs fixes for all findings, and
  verifies that implementations, features, and functionalities are not broken
  after changes. Use when the user runs /larastan-fix, asks to run Larastan,
  PHPStan on a Laravel app, clean up static analysis errors, or fix Larastan
  findings without regressions.
disable-model-invocation: true
---

# /larastan-fix

Run **Larastan** (PHPStan + Laravel extension), fix **all** findings, and prove behavior still works.

Do **not** stop after the first file. Do **not** mass-ignore or regenerate a baseline to “pass.” Prefer root-cause fixes. After every batch of edits, re-verify with project checks so implementations, features, and functionalities are not broken.

## Workflow

Copy this checklist and track progress:

```
Larastan Fix Progress:
- [ ] 1. Confirm Laravel project + Larastan setup + verification commands
- [ ] 2. Baseline analyse
- [ ] 3. Triage findings (priority order)
- [ ] 4. Fix in batches (explain → edit → verify)
- [ ] 5. Re-analyse until clean (or document intentional leftovers)
- [ ] 6. Final verification + report
```

### 1. Confirm Laravel project + Larastan setup + verification commands

From the project root:

1. Confirm this is a Laravel app (`artisan`, `composer.json` with `laravel/framework`) — abort with a clear message if not.
2. Confirm Larastan is available:

```bash
composer show larastan/larastan 2>/dev/null || composer show nunomaduro/larastan 2>/dev/null
test -f phpstan.neon -o -f phpstan.neon.dist -o -f phpstan.dist.neon
test -x vendor/bin/phpstan
```

If Larastan / PHPStan is missing, install only with user approval:

```bash
composer require --dev larastan/larastan
```

Ensure config includes the Larastan extension (create `phpstan.neon` only if none exists and the user wants setup):

```neon
includes:
    - vendor/larastan/larastan/extension.neon
    - vendor/nesbot/carbon/extension.neon

parameters:
    paths:
        - app/
    level: 5
```

Do **not** raise the configured level unless the user asks. Analyse at the project’s configured level.

3. Detect verification commands. Prefer existing Composer / Artisan scripts:

```bash
composer test                    # or phpunit / pest
php artisan test
vendor/bin/pest
vendor/bin/phpunit
vendor/bin/pint --test           # style check only; not a substitute for tests
php artisan route:list           # smoke when helpful
```

Record the chosen commands before editing. If no tests exist, say so and still use the strongest available checks (at least a second Larastan run + Pint if present).

### 2. Baseline analyse

Use the project binary (respects `phpstan.neon*`):

```bash
./vendor/bin/phpstan analyse --memory-limit=2G
```

If Composer defines a script (`composer phpstan` / `composer analyse`), prefer that.

For machine-readable output when practical:

```bash
./vendor/bin/phpstan analyse --memory-limit=2G --error-format=json > .larastan-baseline.json
```

Delete or leave untracked any temporary report files before finishing.

Path-scoped cleanup only when the user asks:

```bash
./vendor/bin/phpstan analyse app/Http/Controllers --memory-limit=2G
```

Default for this skill is a **full** configured analyse unless the user scopes it.

### 3. Triage findings

Work findings in this priority:

1. **Runtime-breaking** — undefined methods/properties, wrong argument counts, impossible types that would crash
2. **Null safety** — unsafe property/method access on nullable models, requests, relations
3. **Laravel / Eloquent correctness** — wrong relation types, builder misuse, container/`auth`/`request` type gaps Larastan flags
4. **PHPDoc / generics** — collection/model generics, `@var` / `@param` / `@return` that hide real bugs
5. **Dead code / unreachable** — always-true/false conditions, unused private methods (only remove when safe)
6. **Remaining level noise** — stricter level complaints that need small, local typing improvements

Group by file or by shared root cause (e.g. one incomplete Form Request type used everywhere).

### 4. Fix in batches (explain → edit → verify)

For each batch (prefer one error identifier / one file group):

1. **Explain the fix** briefly: what PHPStan reported, why the change is safe, what runtime behavior must stay the same.
2. **Edit** the minimum code needed. Match Laravel project patterns (Form Requests, Actions, Eloquent APIs, API Resources).
3. **Verify immediately** with the commands from step 1 (fastest relevant suite after each batch; full suite before the final report).
4. If verification fails: **revert or repair** before continuing. Never leave the tree broken to chase a clean Larastan run.

#### Fix construction rules

- Preserve HTTP contracts: routes, status codes, JSON shapes, validation rules, auth/gates, jobs/events side effects.
- Prefer real types and narrowing (`=== null` checks, early returns, assert helpers) over silencing.
- Prefer accurate PHPDoc / generics on Eloquent models and collections when the code is already correct.
- Do not change business logic to satisfy the analyser when a precise type assertion or request DTO is enough.
- Do not upgrade Laravel/PHP major versions or rewrite architecture unless the user expands scope.
- Keep diffs small and reviewable.

#### Ignores / baseline (last resort only)

Prefer fixing the root cause. Use ignores only when:

- the finding is a true false positive for this Laravel version/package, **or**
- a correct fix would be an out-of-scope rewrite the user did not approve

Narrow inline ignore:

```php
// @phpstan-ignore-next-line
```

Or identifier-based ignores when the project PHPStan version supports them. Prefer next-line / specific `ignoreErrors` path patterns over global rules.

Do **not** run `--generate-baseline` to clear findings unless the user explicitly asks for a baseline workflow.

Document every ignore in the final report with file, message/identifier, and reason.

### 5. Re-analyse until clean

After fixes:

```bash
./vendor/bin/phpstan analyse --memory-limit=2G
```

Repeat triage → fix → verify until:

- analyse exits 0 with no errors, **or**
- only explicitly approved / documented ignores or deferred items remain

Do not claim “all clear” if analyse still fails.

### 6. Final verification + report

Run the full verification set from step 1 again.

Report in this shape:

```markdown
## Larastan fix report

### Analyse
- Config: <phpstan.neon*|level>
- Baseline: <N errors>
- Final: <clean | N remaining>

### Fixed
- <error summary> — file(s) — one-line fix summary

### Ignores
- none | file:line — reason

### Verification
- <command> — pass/fail
- <command> — pass/fail

### Deferred (needs user decision)
- <finding> — why not fixed
```

## Safety

- Do not commit or push unless the user asks.
- Do not use `--force` git commands.
- Do not commit secrets (`.env`, credentials).
- Stop and ask if a “fix” requires deleting substantial features, changing API contracts, or broad behavioral changes.
