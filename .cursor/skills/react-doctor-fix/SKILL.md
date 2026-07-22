---
name: react-doctor-fix
description: >-
  Runs react-doctor, constructs fixes for all findings, and verifies that
  implementations, features, and functionalities are not broken after changes.
  Use when the user runs /react-doctor-fix, asks to run react-doctor, clean up
  React Doctor diagnostics, or fix React Doctor findings without regressions.
disable-model-invocation: true
---

# /react-doctor-fix

Run **React Doctor**, fix **all** findings, and prove behavior still works.

Do **not** stop after the first category. Do **not** mass-suppress. Prefer root-cause fixes. After every batch of edits, re-verify with project checks so implementations, features, and functionalities are not broken.

## Workflow

Copy this checklist and track progress:

```
React Doctor Fix Progress:
- [ ] 1. Confirm React project + available verification commands
- [ ] 2. Baseline scan (verbose + JSON)
- [ ] 3. Triage findings (priority order)
- [ ] 4. Fix in batches (explain → edit → verify)
- [ ] 5. Re-scan until clean (or document intentional leftovers)
- [ ] 6. Final verification + report
```

### 1. Confirm React project + verification commands

From the project root:

1. Confirm this is a React / Next.js / Vite / Remix / Expo (or similar) app — abort with a clear message if not.
2. Detect how to verify nothing broke. Prefer existing scripts from `package.json` in this order when present:

```bash
npm test          # or pnpm / yarn / bun equivalent
npm run typecheck # or tsc --noEmit
npm run lint
npm run build
```

Record the chosen commands before editing. If none exist, use the strongest available subset (at least typecheck or build) and say what you could not run.

Optional monorepo:

```bash
npx react-doctor@latest -y --verbose --project <name>
```

### 2. Baseline scan

Always non-interactive for agents:

```bash
npx react-doctor@latest -y --verbose --no-score
```

Also capture machine-readable output when practical:

```bash
npx react-doctor@latest -y --verbose --no-score --json > .react-doctor-baseline.json
```

If the JSON file would be committed accidentally, delete it before finishing (or keep it untracked). Prefer a temp path when easy.

For branch-scoped cleanup only (when the user asks for changed files / PR noise only):

```bash
npx react-doctor@latest -y --verbose --no-score --scope changed
```

Default for this skill is a **full** scan unless the user scopes it.

### 3. Triage findings

Work findings in this priority:

1. **Security**
2. **Correctness** / broken behavior risks
3. **State & effects** (derived state in effects, effect loops, missing deps that matter)
4. **Performance**
5. **Accessibility**
6. **Architecture** / dead code / bundle / remaining warnings

Within a priority, fix `error` before `warning`.

For an unclear rule:

```bash
npx react-doctor@latest rules explain <rule>
npx react-doctor@latest why path/to/file.tsx:123
```

Optional per-rule guidance from React Doctor prompts (when helpful):

`https://www.react.doctor/prompts/rules/react-doctor/<rule>.md`

Example: `https://www.react.doctor/prompts/rules/react-doctor/no-derived-state.md`

### 4. Fix in batches (explain → edit → verify)

For each batch (prefer one rule or one tightly related file group):

1. **Explain the fix** briefly: what is wrong, why the change is safe, what behavior must stay the same.
2. **Edit** the minimum code needed. Match project patterns. Do not drive-by refactors.
3. **Verify immediately** with the commands from step 1 (at least the fastest relevant ones after each batch; full suite before the final report).
4. If verification fails: **revert or repair** the fix before continuing. Never leave the tree broken to chase a cleaner doctor score.

#### Fix construction rules

- Preserve public behavior, routes, props contracts, visible UI, and user flows.
- Prefer derived values during render over syncing state in `useEffect`.
- Prefer event handlers / key handlers over effect-driven “do X when Y changes” when Y is a user action.
- Do not remove “unused” exports/files that are part of a public package API, generated barrels, or framework entrypoints without confirming.
- Do not change dependency versions unless a finding explicitly requires it and the user wants that scope.
- Keep diffs small and reviewable.

#### Suppressions (last resort only)

Prefer fixing the root cause. Suppress only when:

- the finding is a true false positive for this codebase, **or**
- a correct fix would be an out-of-scope rewrite the user did not approve

Keep suppressions narrow:

```tsx
// react-doctor-disable-next-line react-doctor/no-derived-state
```

Never disable whole categories (`rules category … off`) unless the user explicitly asks.

Document every suppression in the final report with file, rule, and reason.

### 5. Re-scan until clean

After fixes:

```bash
npx react-doctor@latest -y --verbose --no-score
```

Repeat triage → fix → verify until:

- the scan reports no remaining findings, **or**
- only explicitly approved / documented suppressions or deferred items remain

Do not claim “all clear” if the scan still fails.

### 6. Final verification + report

Run the full verification set from step 1 again.

Report in this shape:

```markdown
## React Doctor fix report

### Scan
- Baseline: <N findings / score if shown>
- Final: <clean | N remaining>

### Fixed
- `rule-id` — file(s) — one-line fix summary

### Suppressions
- none | `rule-id` @ file:line — reason

### Verification
- <command> — pass/fail
- <command> — pass/fail

### Deferred (needs user decision)
- <finding> — why not fixed
```

## Safety

- Do not commit or push unless the user asks.
- Do not use `--force` git commands.
- Do not run `react-doctor` network-sharing flows that the user declined; `--no-score` avoids score/share API usage.
- Stop and ask if a “fix” requires deleting substantial features, changing product behavior, or broad API breakage.
