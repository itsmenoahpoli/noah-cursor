---
name: publish-npm
description: >-
  Runs /commit-push first, always bumps the patch version, updates GitHub Pages
  docs (releases + site metadata), then publishes noah-cursor to npm. Use when
  the user runs /publish-npm, /publish, asks to publish to npm, or release the
  CLI package for this repository only.
disable-model-invocation: true
---

# /publish-npm

Project-only release skill for **noah-cursor**.

Always run **`/commit-push` first**, then bump, **update GitHub Pages documentation**, publish to npm.

GitHub Pages is the public docs site for this CLI (`docs/` → Actions deploy). Every publish must sync version notes there.

## Workflow

Copy this checklist and track progress:

```
Publish Progress:
- [ ] 1. Run /commit-push
- [ ] 2. Verify package identity
- [ ] 3. Confirm npm auth
- [ ] 4. Preflight (build + test)
- [ ] 5. Bump version (always patch)
- [ ] 6. Update GitHub Pages docs
- [ ] 7. Commit + push docs (triggers Pages deploy)
- [ ] 8. npm publish
- [ ] 9. Verify + report
```

### 1. Run /commit-push first (required)

Read and follow [`.cursor/skills/commit-push/SKILL.md`](../commit-push/SKILL.md) end-to-end:

1. Inspect git state
2. Stage all changes (`git add -A`)
3. Categorize / group files
4. Draft a linepush-style conventional commit
5. Commit
6. Push to `origin`

If the working tree is already clean after a recent commit/push, say so and continue — do not create an empty commit.

If commit-push fails (hooks, auth, secrets), **stop** — do not publish.

### 2. Verify package identity

Confirm you are in this repo and publishing the right package:

```bash
pwd
node -p "require('./package.json').name + '@' + require('./package.json').version"
git status --short
git branch -vv
```

Expected package name: `noah-cursor`

Abort if:

- Not in the Noah Cursor Registry project root
- `package.json` name is not `noah-cursor`
- Uncommitted changes still remain (go back to step 1)

### 3. Confirm npm auth

```bash
npm whoami
```

If auth fails:

1. Tell the user to run `npm login --auth-type=web` (or provide an `NPM_TOKEN`)
2. **Stop** — do not publish unauthenticated

Optional dry check:

```bash
npm view noah-cursor version
```

(If the package is unpublished yet, `npm view` failing is OK.)

### 4. Preflight

`prepublishOnly` already runs build + test. Still run them explicitly so failures are obvious before bumping version:

```bash
npm run build
npm test
npm run typecheck
```

Stop on any failure.

### 5. Bump version (always patch)

**Rule: always bump the patch version.** Do not ask the user. Do not use minor or major unless the user explicitly overrides in the current message.

```bash
npm version patch
```

Example: `1.0.0` → `1.0.1`, `1.0.1` → `1.0.2`.

Then push the version commit and tag:

```bash
git push
git push --tags
```

Notes:

- `npm version patch` creates a version commit + git tag automatically.
- Do **not** use `--force` tags/push unless the user explicitly asks.
- Never publish secrets (`.env`, tokens, private keys).
- Do not skip the bump to “keep current” — every `/publish-npm` run ships a new patch.

### 6. Update GitHub Pages docs (required)

After the version bump, sync the public docs site so Releases and metadata match npm.

1. Read the new version:

```bash
node -p "require('./package.json').version"
```

2. Draft release notes from commits since the previous tag (title, 1-line summary, 2–6 bullet notes). Be accurate; do not invent features.

3. Run the sync script with those notes (preferred):

```bash
node scripts/sync-docs-release.mjs \
  --title "Short release title" \
  --summary "One-line summary of this release." \
  --note "First concrete change" \
  --note "Second concrete change"
```

If you have no crafted notes yet, running without `--note` will scaffold from `git log` — then **edit** `docs/releases.json` so notes are clear and user-facing.

What the script updates:

- `docs/releases.json` — prepends the new version; sets `latest`
- `docs/index.html` — `softwareVersion` in JSON-LD

Rules:

- Only versions `>= minVersion` (`1.5.7`) appear on the Releases page — do not lower `minVersion`
- Keep the disclaimer block intact
- Do not remove older public releases (`>= 1.5.7`) unless the user asks
- For a special label (rare), pass `--label "First public" --label-tone public`

### 7. Commit + push docs (triggers Pages deploy)

Stage and commit the docs sync, then push to `main` so `.github/workflows/pages.yml` deploys `docs/`:

```bash
git add docs/releases.json docs/index.html
git status --short
git commit -m "$(cat <<'EOF'
docs(releases): sync GitHub Pages notes for vX.Y.Z

EOF
)"
git push
```

Replace `X.Y.Z` with the real version.

If there are no docs diffs (already synced), say so and continue.

Confirm the Pages workflow path still covers docs:

- Workflow: `.github/workflows/pages.yml`
- Deploys folder: `docs/`
- Public site: `https://itsmenoahpoli.github.io/noah-cursor/`
- Releases page: `https://itsmenoahpoli.github.io/noah-cursor/releases.html`

### 8. npm publish

Publish the public package:

```bash
npm publish --access public
```

Do not use `--otp` unless the user provides a one-time password / 2FA code.

If publish fails because the version already exists:

1. Report the error
2. Run `npm version patch` again
3. Re-run **steps 6–7** for the new version
4. Push commits/tags, then retry `npm publish --access public`

### 9. Verify + report

```bash
npm view noah-cursor version
npm view noah-cursor bin
```

Report:

- Published version (`noah-cursor@x.y.z`)
- npm package URL: `https://www.npmjs.com/package/noah-cursor`
- GitHub Pages docs URL: `https://itsmenoahpoli.github.io/noah-cursor/`
- Releases notes URL: `https://itsmenoahpoli.github.io/noah-cursor/releases.html`
- Git commit/tag pushed
- Install command: `npx noah-cursor`

## Safety

- This skill is **project-only** (lives in `.cursor/skills/`). Do not copy it into the distributable `skills/` registry unless the user asks.
- Always commit-push before publish
- Always update GitHub Pages docs for the new version before finishing
- Never update git config
- Never `--force` publish overwrites / never unpublish unless explicitly requested
- Never skip `prepublishOnly` / tests unless the user explicitly asks
- If 2FA / OTP is required, pause and ask the user for the code
