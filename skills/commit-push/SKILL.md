---
name: commit-push
description: >-
  Stages all changes, groups files by category, drafts a linepush-style
  conventional commit message, commits, and pushes. Use when the user runs
  /commit-push, asks to commit and push, or wants an AI-generated commit from
  the current working tree.
disable-model-invocation: true
---

# /commit-push

Stage everything, categorize the changeset, write a **linepush-style** commit
message, commit, then push.

## Workflow

Copy this checklist and track progress:

```
Commit-Push Progress:
- [ ] 1. Inspect repo state
- [ ] 2. Stage all changes
- [ ] 3. Categorize / group files
- [ ] 4. Draft commit message
- [ ] 5. Commit
- [ ] 6. Push
```

### 1. Inspect repo state

Run in parallel:

```bash
git status --short
git diff
git diff --cached
git log -5 --oneline
git branch -vv
```

Abort early if:

- Not a git repository
- No changes to commit (clean working tree and empty index)
- Secrets are about to be committed (`.env`, credentials, private keys, tokens) — warn and exclude them unless the user explicitly insists

### 2. Stage all changes

```bash
git add -A
```

Re-check:

```bash
git status --short
git diff --cached --stat
```

Do **not** use `--no-verify`, amend, force-push, or rewrite history unless the user explicitly asks.

### 3. Categorize / group files

Group every staged path into one or more of these buckets (a file may only belong to one primary bucket):

| Bucket | Match hints |
|--------|-------------|
| `feat` | New user-facing capability, new modules/commands |
| `fix` | Bug fixes, regressions, error handling corrections |
| `refactor` | Restructures with no intended behavior change |
| `docs` | README, markdown, comments-only docs |
| `test` | `*.test.*`, `*.spec.*`, `__tests__`, `src/tests` |
| `style` | Formatting, lint autofix, whitespace-only |
| `chore` | Tooling, configs, ignore files, housekeeping |
| `ci` | `.github/`, workflows, CI scripts |
| `build` | `package.json`, lockfiles, tsconfig, bundler config |
| `perf` | Performance-only changes |
| `ui` | TUI/CLI presentation, banners, styling assets |
| `assets` | Images, static media |

Also infer a **scope** from paths when clear, e.g.:

- `src/commands/` → `cli`
- `src/ui/` → `ui`
- `src/services/` → `services`
- `skills/` → `skills`
- `rules/` → `rules`
- root config / package → `repo`

Present a short grouping summary to the user before committing, for example:

```text
Grouped changes
  feat (cli): src/commands/browse.ts, src/ui/*
  docs: README.md
  assets: assets/noah-cursor-banner.png
  build: package.json, package-lock.json
```

### 4. Draft commit message (linepush style)

Use **Conventional Commits**, inspired by [linepush](https://www.npmjs.com/package/linepush):

```text
type(scope): imperative summary

- grouped change bullet
- grouped change bullet
```

Rules:

1. Pick the **primary** `type` from the dominant bucket (or the highest-impact user-facing change).
2. `scope` is optional but preferred when one area dominates; omit rather than invent noise.
3. Summary: imperative, ≤72 chars, no trailing period, focus on **why/impact** not file lists.
4. Body: bullets grouped by category when multiple buckets exist.
5. Match the repository’s recent `git log` tone when possible.
6. Never commit secrets.

**Examples:**

Single-focus:

```text
feat(browse): add interactive registry browse TUI

- add category and asset multi-select menus
- wire installFromSelections into browse flow
```

Multi-group:

```text
feat(cli): ship browse TUI and README branding

- feat: interactive browse command and UI modules
- docs: document browse usage in README
- assets: add NOAH Cursor README banner
- build: add figlet, boxen, and gradient-string
```

### 5. Commit

Show the drafted message, then commit with a HEREDOC:

```bash
git commit -m "$(cat <<'EOF'
type(scope): summary

- bullet
- bullet
EOF
)"
```

If a pre-commit hook fails, fix the issue and create a **new** commit (do not amend unless the user explicitly asks and amend rules allow it).

Verify:

```bash
git status
```

### 6. Push

Push the current branch to its upstream:

```bash
git push -u origin HEAD
```

If upstream already tracks the branch:

```bash
git push
```

Do **not** `push --force` unless the user explicitly requests it.

On success, report:

- commit hash / subject
- grouping summary
- remote branch URL if available (`gh` / remote)

## Safety

- Never update git config
- Never skip hooks unless explicitly requested
- Never force-push `main` / `master`
- Warn before committing `.env`, key files, or credential JSON
- If push needs auth, stop and tell the user what to run locally
