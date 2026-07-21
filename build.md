# Build Noah Cursor

You are a senior Staff Software Engineer tasked with building a
production-quality open-source CLI called **Noah Cursor**.

## Vision

Create an npm CLI that installs reusable Cursor assets (Skills, Rules,
Prompts, MCP configurations, Presets) from any compatible GitHub
repository into the current project.

Example:

```bash
npx noah-cursor add https://github.com/<owner>/registry --skill laravel-crud
npx noah-cursor add https://github.com/<owner>/registry --rule laravel
npx noah-cursor add https://github.com/<owner>/registry --preset laravel-enterprise
npx noah-cursor add https://github.com/<owner>/registry --all
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
noah-cursor add <repository>

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

1.  Clone repository to a temporary directory.
2.  Validate registry structure.
3.  Read and validate `manifest.json`.
4.  Validate requested assets.
5.  Install assets into `.cursor/`.
6.  Write `.cursor/noah.json`.
7.  Clean up temporary files.

## Registry Specification

    manifest.json
    skills/
    rules/
    prompts/
    mcp/
    presets/

Support any compatible GitHub repository.

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
