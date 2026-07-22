---
name: publish-npm
description: >-
  Runs /commit-push first, always bumps the patch version, then publishes
  noah-cursor to npm. Use when the user runs /publish-npm, asks to publish
  to npm, or release the CLI package for this repository only.
disable-model-invocation: true
---

# /publish-npm

Project-only release skill for **noah-cursor**.

Always run **`/commit-push` first**, then publish to the npm registry.

## Workflow

Copy this checklist and track progress:

```
Publish Progress:
- [ ] 1. Run /commit-push
- [ ] 2. Verify package identity
- [ ] 3. Confirm npm auth
- [ ] 4. Preflight (build + test)
- [ ] 5. Bump version (always patch)
- [ ] 6. npm publish
- [ ] 7. Verify + report
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

### 6. npm publish

Publish the public package:

```bash
npm publish --access public
```

Do not use `--otp` unless the user provides a one-time password / 2FA code.

If publish fails because the version already exists:

1. Report the error
2. Run `npm version patch` again
3. Push commits/tags, then retry `npm publish --access public`

### 7. Verify + report

```bash
npm view noah-cursor version
npm view noah-cursor bin
```

Report:

- Published version (`noah-cursor@x.y.z`)
- npm package URL: `https://www.npmjs.com/package/noah-cursor`
- Git commit/tag pushed
- Install command: `npx noah-cursor`

## Safety

- This skill is **project-only** (lives in `.cursor/skills/`). Do not copy it into the distributable `skills/` registry unless the user asks.
- Always commit-push before publish
- Never update git config
- Never `--force` publish overwrites / never unpublish unless explicitly requested
- Never skip `prepublishOnly` / tests unless the user explicitly asks
- If 2FA / OTP is required, pause and ask the user for the code
