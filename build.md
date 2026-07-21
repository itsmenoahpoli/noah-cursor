# Build Noah Cursor

You are a senior Staff Software Engineer tasked with building a
production-quality open-source CLI called **Noah Cursor**.

## Vision

Create an npm CLI that installs Noah's reusable Cursor assets (Skills, Rules,
Prompts, MCP configurations, Presets) from the official Noah registry
(`https://github.com/itsmenoahpoli/noah-cursor`) into the current project.

Example:

```bash
npx noah-cursor add --skill laravel-crud
npx noah-cursor add --rule laravel
npx noah-cursor add --preset laravel-enterprise
npx noah-cursor add --all
```

## Requirements

- TypeScript
- Node.js LTS
- Commander.js
- fs-extra
- simple-git
- chalk
- ora
- execa
- zod
- @inquirer/prompts
- vitest
- eslint
- prettier

## Commands

- `add`
- `search`
- `list`
- `remove`
- `update`
- `doctor`

### add

```bash
noah-cursor add [repository]

--skill <name>
--rule <name>
--prompt <name>
--mcp <name>
--preset <name>
--all
--force
--dry-run
--yes
--verbose
```

Behavior:

1.  Resolve registry (defaults to the build-time bundled registry; reject third-party remotes).
2.  Load bundled or local registry (no GitHub clone for the default path).
3.  Validate registry structure.
4.  Read and validate `manifest.json`.
5.  Validate requested assets.
6.  Install assets into `.cursor/`.
7.  Write `.cursor/noah.json`.
8.  Clean up temporary files (remote clones only).

## Registry Specification

    manifest.json
    skills/
    rules/
    prompts/
    mcp/
    presets/

The official registry is **bundled into the npm package at build time**.
Local paths (e.g. `.`) are allowed for development of this repo.
GitHub clone/sign-in is not required for normal use.

## Installation Targets

    .cursor/
        skills/
        rules/
        prompts/
        mcp/
        noah.json

## Local Metadata

```json
{
  "registry": "https://github.com/<owner>/registry",
  "installed": [
    {
      "type": "skill",
      "id": "laravel-crud",
      "version": "1.0.0"
    }
  ]
}
```

## Architecture

    src/
      commands/
      core/
      services/
      installers/
      registry/
      metadata/
      utils/
      types/
      constants/
      templates/
      tests/

- SOLID principles
- Clean Architecture
- Strong TypeScript
- Cross-platform
- Extensible asset handlers
- Beautiful terminal UX
- Comprehensive error handling
- Comprehensive tests

## Deliverable

Generate a complete production-ready npm package named **noah-cursor**
that can be published with:

```bash
npm publish
```

After publishing, users should be able to run:

```bash
npx noah-cursor add https://github.com/patrickpoli/noah-registry --skill laravel-crud
```

without installing the package globally.
