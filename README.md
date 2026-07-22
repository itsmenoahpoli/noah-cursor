<p align="center">
  <img src="https://cdn.jsdelivr.net/npm/noah-cursor@latest/assets/noah-cursor-banner.png" alt="Noah Cursor" width="100%" />
</p>

Install Noah's reusable Cursor assets — Skills, Rules, Prompts, MCP configs, and Presets — into your project.

```bash
npx noah-cursor add --skill test
```

## Install

```bash
# One-shot (recommended) — uses the registry bundled in the package
npx noah-cursor add --skill <name>

# Or install globally
npm install -g noah-cursor
```

Requires **Node.js 20+**. The registry ships inside the package (no GitHub clone or sign-in).

## Commands

| Command  | Description                             |
| -------- | --------------------------------------- |
| `add`    | Install assets from Noah's registry     |
| `browse` | Interactively browse and install assets |
| `search` | Search assets in Noah's registry        |
| `list`   | List all assets in Noah's registry      |
| `remove` | Remove an installed asset               |
| `update` | Re-fetch and update installed assets    |
| `doctor` | Diagnose environment health             |

### browse

Interactive TUI for discovering assets without knowing their ids:

```bash
noah-cursor browse
noah-cursor browse --browse-skills
noah-cursor browse --browse-rules
noah-cursor browse --browse-prompts
noah-cursor browse --browse-mcp
noah-cursor browse --browse-presets
```

```bash
npx noah-cursor browse
npx noah-cursor browse --browse-skills
```

Controls: ↑↓ navigate · Space select · A toggle all · I invert · Enter confirm · Esc cancel

### add

```bash
noah-cursor add

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

Always installs from **Noah's bundled registry** (no other registries).

Examples:

```bash
npx noah-cursor add --skill test
npx noah-cursor add --rule test
npx noah-cursor add --all
npx noah-cursor add --skill commit-push
```

### search / list / remove / update / doctor

```bash
noah-cursor search test
noah-cursor list
noah-cursor list --installed
noah-cursor remove skill test --yes
noah-cursor update --yes
noah-cursor doctor
```

## Registry specification

This repo is both the **CLI** and the **registry**. At the project root:

```
manifest.json
skills/
rules/
prompts/
mcp/
presets/
```

### Starter assets

- **skill** `test`
- **skill** `commit-push`
- **skill** `react-doctor-fix` — run react-doctor, fix findings, verify no regressions
- **skill** `larastan-fix` — run Larastan on Laravel, fix findings, verify no regressions
- **skill** `nestjs-knip-fix` — run Knip on NestJS, fix unused code/deps, verify no regressions
- **skill** `node-doctor-fix` — bundled node-doctor (Knip + package hygiene) for generic Node
- **skill** `generate-readme` — generate project README (stack, deps, setup guide)
- **rule** `test`

Add curated Noah assets under those folders and register them in `manifest.json`. Presets are supported by the CLI but none are published in this registry yet.

### manifest.json

```json
{
  "name": "noah-registry",
  "version": "1.0.0",
  "description": "My Cursor assets",
  "skills": [
    {
      "id": "test",
      "version": "1.0.0",
      "description": "Sample skill",
      "tags": ["test"]
    }
  ],
  "rules": [
    {
      "id": "test",
      "version": "1.0.0",
      "description": "Sample rule"
    }
  ],
  "prompts": [],
  "mcp": [],
  "presets": []
}
```

Each asset `id` maps to a folder under the matching directory (e.g. `skills/test/`), unless an explicit `path` is set.

## Installation targets

Assets are copied into your project:

```
.cursor/
  skills/
  rules/
  prompts/
  mcp/
  noah.json
```

### .cursor/noah.json

```json
{
  "registry": "https://github.com/itsmenoahpoli/noah-cursor",
  "installed": [
    {
      "type": "skill",
      "id": "test",
      "version": "1.0.0"
    }
  ]
}
```

## Development

```bash
npm install
npm run build   # compiles TypeScript and bundles registry → dist/registry
npm test
npm run dev -- doctor
```

`npm run build` copies `manifest.json` plus `skills/`, `rules/`, `prompts/`, `mcp/`, and `presets/` into `dist/noah-registry/` so published installs never need to clone GitHub.

## License

MIT
