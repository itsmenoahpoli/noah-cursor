---
name: generate-readme
description: >-
  Generates a project README with title, description, tech stack, dependencies,
  prerequisites, installation, and setup guide from the real codebase. Use when
  the user runs /generate-readme, asks for a project README, docs for setup, or
  to rewrite/improve README.md.
disable-model-invocation: true
---

# /generate-readme

Generate (or rewrite) a **project `README.md`** from the actual repository — not generic filler.

Infer title, description, tech stack, dependencies, prerequisites, and setup steps from real config and scripts. Prefer accuracy over marketing. Do not invent APIs, env vars, or commands that are not in the project.

## Workflow

Copy this checklist and track progress:

```
README Progress:
- [ ] 1. Inspect project identity and stack
- [ ] 2. Collect prerequisites, deps, and scripts
- [ ] 3. Draft README from the template
- [ ] 4. Write README.md (preserve intentional extras)
- [ ] 5. Sanity-check commands and report
```

### 1. Inspect project identity and stack

From the project root, gather facts (read only what exists):

| Source | Extract |
|--------|---------|
| `package.json` / `composer.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` | name, description, version, scripts, engines, deps |
| `nest-cli.json`, `next.config.*`, `vite.config.*`, `angular.json`, `nuxt.config.*` | framework |
| `artisan`, `manage.py`, `Dockerfile`, `docker-compose*.yml` | runtime / services |
| `.env.example`, `.env.sample`, `*.env.example` | required env vars (names only — never real secrets) |
| existing `README.md` | keep badges, license links, or sections the user clearly wants |

Detect primary stack (examples): Node/TypeScript, NestJS, Next.js, React/Vite, Laravel/PHP, Python, Go, monorepo (list workspaces).

If the repo is empty or not a software project, stop and say so.

### 2. Collect prerequisites, deps, and scripts

Document:

1. **Prerequisites** — language/runtime versions (`engines`, `.nvmrc`, `.php-version`, `volta`, CI matrix), package managers, Docker/DB only if the project actually uses them.
2. **Dependencies** — summarize from lock/manifests: runtime vs dev; group by role (framework, DB, auth, UI). Do not dump every transitive package.
3. **Install / setup commands** — copy exact scripts from the package manager files (`npm ci`, `composer install`, `php artisan key:generate`, etc.). Prefer the package manager the repo already uses (lockfile wins: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lock*` → bun, else npm / composer).
4. **Run / test / build** — from scripts: `dev`/`start`, `build`, `test`, `lint`.
5. **Optional** — migrations, seeders, queue workers, Storybook — only if present.

Never paste secrets from `.env`. Only document variable **names** from examples.

### 3. Draft README from the template

Use this structure unless the user asks for a different outline. Omit sections that do not apply (do not leave empty stubs).

```markdown
# <Project Title>

<One-paragraph description: what it is and who it is for.>

## Tech stack

- <Language / runtime>
- <Framework(s)>
- <Key libraries / services>

## Prerequisites

- <Tool> <version constraint if known>
- …

## Dependencies

### Runtime
- …

### Development
- …

## Installation

\`\`\`bash
# clone (if public URL known)
git clone <url>
cd <dir>

# install
<package-manager install>
\`\`\`

## Setup

1. Copy env example: `cp .env.example .env`
2. <configure env vars — list names>
3. <migrate / generate keys / link storage — only if applicable>

## Usage

\`\`\`bash
<dev server command>
\`\`\`

| Command | Description |
|---------|-------------|
| `…` | … |

## Project structure

\`\`\`text
<short tree of important top-level dirs only>
\`\`\`

## Testing

\`\`\`bash
<test command>
\`\`\`

## License

<from LICENSE / package.json, or omit if unknown>
```

Rules:

- Title: human-readable (from package name or repo name); not a raw npm id unless that is the product name.
- Description: 1–3 sentences grounded in the codebase or existing README — no buzzword salad.
- Commands: fenced bash, copy-pasteable from repo root.
- Keep tone direct and concise (same bar as good open-source READMEs).
- Absolute image URLs only if the user wants a banner and a public host exists; do not break private-repo badges.

### 4. Write README.md

- Default path: `README.md` at repo root.
- If `README.md` already exists: **replace** with the generated doc unless the user asked to “update” or “append” — then merge carefully and keep custom sections (Changelog, Contributing, Security) when they look intentional.
- Do not commit or push unless the user asks.
- Do not delete `LICENSE` or other docs.

### 5. Sanity-check and report

Confirm every command in the README matches a real script or documented binary. Fix mismatches before finishing.

Report:

```markdown
## README generated

- Path: README.md
- Stack detected: <…>
- Sections included: <list>
- Skipped (N/A): <list>
- Follow-ups: <missing .env.example, unclear start script, etc.>
```

## Safety

- Never invent install steps for tools the project does not use.
- Never commit `.env` or secrets.
- Never overwrite a README with placeholder lorem ipsum.
- If multiple apps exist in a monorepo, either document the root workspace clearly or ask which package to document first (default: root + note workspaces).
