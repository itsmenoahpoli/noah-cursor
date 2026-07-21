<p align="center">
  <img src="assets/noah-cursor-banner.png" alt="Noah Cursor" width="100%" />
</p>

Install reusable Cursor assets — Skills, Rules, Prompts, MCP configs, and Presets — from any compatible GitHub registry into your project.

```bash
npx noah-cursor add https://github.com/itsmenoahpoli/noah-cursor --skill test
```

## Install

```bash
# One-shot (recommended)
npx noah-cursor add <repository> --skill <name>

# Or install globally
npm install -g noah-cursor
```

Requires **Node.js 20+** and **Git**.

## Commands

| Command  | Description                             |
| -------- | --------------------------------------- |
| `add`    | Install assets from a registry          |
| `browse` | Interactively browse and install assets |
| `search` | Search assets in a registry             |
| `list`   | List installed assets                   |
| `remove` | Remove an installed asset               |
| `update` | Re-fetch and update installed assets    |
| `doctor` | Diagnose environment health             |

### browse

Interactive TUI for discovering assets without knowing their ids:

```bash
noah-cursor browse <repository>
noah-cursor browse <repository> --browse-skills
noah-cursor browse <repository> --browse-rules
noah-cursor browse <repository> --browse-prompts
noah-cursor browse <repository> --browse-mcp
noah-cursor browse <repository> --browse-presets
```

Examples:

```bash
npx noah-cursor browse https://github.com/itsmenoahpoli/noah-cursor
npx noah-cursor browse . --browse-skills
```

Controls: ↑↓ navigate · Space select · A toggle all · I invert · Enter confirm · Esc cancel

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

Examples:

```bash
# From another project — install from this GitHub registry
npx noah-cursor add https://github.com/itsmenoahpoli/noah-cursor --skill test
npx noah-cursor add https://github.com/itsmenoahpoli/noah-cursor --rule test
npx noah-cursor add https://github.com/itsmenoahpoli/noah-cursor --preset test
npx noah-cursor add itsmenoahpoli/noah-cursor --all

# Local path while developing
noah-cursor add . --skill test --dry-run
```

### search / list / remove / update / doctor

```bash
noah-cursor search test --registry https://github.com/itsmenoahpoli/noah-cursor
noah-cursor list
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
- **rule** `test`
- **preset** `test` (installs both)

Add your own assets under those folders and register them in `manifest.json`.

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
  "presets": [
    {
      "id": "test",
      "version": "1.0.0",
      "includes": {
        "skills": ["test"],
        "rules": ["test"]
      }
    }
  ]
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
npm run build
npm test
npm run dev -- doctor
```

## License

MIT
