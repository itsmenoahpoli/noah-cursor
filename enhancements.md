# Noah CLI Roadmap

## From Registry to Developer Experience Platform

> Version: v1.0
> Status: Roadmap
> Timeline: 12+ Months

---

# Vision

Noah should evolve beyond being a CLI that installs Cursor rules and prompts.

The long-term goal is to become the **package manager and developer experience platform for AI-assisted software development**, supporting multiple AI coding assistants while providing a polished, interactive, and project-aware workflow.

Instead of asking developers:

> "Which prompt do you want?"

Noah should ask:

> "What are you building?"

Then intelligently configure their entire AI development environment.

---

# Core Principles

- Excellent Developer Experience (DX)
- Interactive Terminal UI
- Project-aware recommendations
- Multi-agent compatibility
- Package management
- Community ecosystem
- Enterprise-ready
- Fast by default

---

# Current State (Completed)

## Existing Features

- Global CLI
- Registry
- Install from URL
- Interactive browser
- Browse Rules
- Browse Skills
- Arrow-key navigation
- Spacebar multi-select
- Beautiful terminal branding
- One-command installation

---

# Phase 1 — Polish the CLI Experience

Goal:
Make Noah enjoyable enough that developers prefer using it over manually downloading resources.

Priority:
★★★★★

---

## Smart Search

Instead of browsing everything:

```bash
noah search laravel
```

Results:

```
Laravel API Standards
Laravel Security
Laravel Testing
Laravel Docker
Laravel DDD
```

Features

- fuzzy search
- instant filtering
- keyboard navigation
- tags
- categories

---

## Interactive Home Menu

```
NOAH CLI

What would you like to do?

> Browse Packages
  Search
  Recent
  Favorites
  Installed
  Updates
  Settings
```

---

## Package Preview

Before installation display

```
Laravel Enterprise

★★★★★

Downloads
42,391

Updated
2 days ago

Contains

✓ Cursor Rules
✓ Claude Commands
✓ Prompt Templates
✓ Documentation
```

---

## Recent Packages

```
noah recent
```

Shows

- recently installed
- recently viewed
- recently updated

---

## Favorites

```
noah favorite add laravel-api

noah favorites
```

---

## Better Terminal UX

- progress bars
- animations
- colours
- success screens
- package summaries

---

Milestone

Developers should enjoy using Noah even before installing anything.

---

# Phase 2 — Become a Package Manager

Goal

Treat AI resources like npm packages.

Priority

★★★★★

---

## Install

```
noah install laravel-enterprise
```

---

## Update

```
noah update
```

---

## Remove

```
noah uninstall laravel-enterprise
```

---

## List Installed

```
noah list
```

---

## Package Versioning

```
laravel-enterprise

v2.4.1
```

Install specific versions

```
noah install laravel-enterprise@2.3
```

---

## Lockfile

Generate

```
noah.lock
```

Example

```yaml
packages:
  - laravel-enterprise@2.4
  - react-performance@1.8
  - docker-workflow@3.2
```

Entire teams remain synchronised.

---

## Dependency Resolution

Installing

```
nestjs-enterprise
```

Automatically installs

- Typescript
- Testing
- Docker
- Git Workflow

Like npm.

---

Milestone

Noah behaves like a real package manager.

---

# Phase 3 — Project Awareness

Goal

Automatically understand the repository.

Priority

★★★★★

---

## Detect Framework

```
Laravel

Vue

Tailwind

Docker

Prisma

Railway
```

---

## Smart Recommendations

```
Recommended

Laravel API Standards

Docker Optimisation

Testing

Security

Prisma Workflow
```

---

## noah doctor

```
noah doctor
```

Outputs

```
Architecture

9.4

Security

6.2

Documentation

3.8

Testing

4.9
```

Suggestions

```
Install

Testing Rules

Security Package

Architecture Guide
```

---

## Project Health

Checks

- framework
- dependencies
- folder structure
- git
- Docker
- CI
- AI config

---

Milestone

Developers receive recommendations without searching.

---

# Phase 4 — AI Assistant Support

Goal

Become platform-independent.

Priority

★★★★★

---

Support

- Cursor
- Claude Code
- Gemini CLI
- Codex CLI
- Continue
- Windsurf
- Cline
- Roo Code
- Aider

Example

```
noah install laravel-api --target claude
```

or

```
--target cursor
```

Same package.

Different output.

---

Package structure

```
cursor/

claude/

gemini/

continue/

docs/

templates/
```

---

Milestone

One ecosystem.

Multiple AI assistants.

---

# Phase 5 — Registry Evolution

Goal

Build a thriving ecosystem.

Priority

★★★★☆

---

## Publishing

```
noah publish
```

Interactive wizard.

---

## Package Metadata

- author
- version
- description
- tags
- screenshots
- downloads

---

## Verified Maintainers

Display

✓ Verified

---

## Trending

```
Trending

Today

This Week

This Month
```

---

## Ratings

★★★★★

---

## Changelog

```
What's New

Breaking Changes

Migration Guide
```

---

Milestone

Community contributes packages.

---

# Phase 6 — Team Collaboration

Goal

Enterprise adoption.

Priority

★★★★☆

---

## Workspace

```
noah workspace
```

Stores

- packages
- versions
- settings

---

## Team Sync

```
noah sync
```

Everyone shares

- rules
- prompts
- commands

---

## Configuration File

```
noah.json
```

Example

```json
{
  "packages": ["laravel-enterprise", "docker", "testing"]
}
```

---

## Bootstrap

```
noah bootstrap
```

Instantly prepares a repository.

---

Milestone

Entire organisations standardise AI workflows.

---

# Phase 7 — AI Intelligence

Goal

Use AI to improve DX.

Priority

★★★★★

---

## Explain Package

```
noah explain laravel-api
```

Explains

- purpose
- benefits
- use cases

---

## Project Analysis

```
noah analyze
```

Finds

- code smells
- missing workflows
- architecture issues

---

## Interactive Setup Wizard

```
What are you building?

API

Website

Microservice

CLI

SaaS
```

Then

```
React?

Vue?

Next?

Laravel?
```

Automatically installs recommended packages.

---

## Upgrade Assistant

```
Laravel 11 detected

Upgrade available

Update related packages?

[Y]
```

---

Milestone

Noah feels intelligent.

---

# Phase 8 — Ecosystem

Goal

Make Noah the standard.

Priority

★★★★☆

---

Possible integrations

GitHub

GitLab

Bitbucket

npm

Docker Hub

MCP Registry

OpenRouter

Cursor Marketplace

Claude Registry

---

Future

```
noah login

noah publish

noah install

noah sync

noah analytics
```

---

# Phase 9 — Enterprise

Goal

Commercial adoption.

Priority

★★★☆☆

---

Features

Private registries

Team permissions

Analytics

Package approval

Version pinning

Internal packages

Audit logs

Compliance

---

# Phase 10 — Long-term Vision

Goal

Own the AI Developer Experience.

---

Imagine

```
cd my-project

noah
```

Output

```
Project Detected

Laravel 12

Vue 3

Docker

Prisma

Health Score

91%

Missing

Testing

Documentation

Security

Recommended Packages

✓ Laravel Enterprise

✓ Docker Workflow

✓ Testing

✓ Security

✓ API Documentation

Install all?

[Y]
```

No searching.

No browsing.

No guessing.

Everything is intelligently recommended.

---

# Stretch Goals

## Interactive Dashboard

```
noah dashboard
```

Shows

- updates
- downloads
- health
- recommendations

---

## Plugin System

```
noah plugin add docker
```

---

## Offline Cache

Previously installed packages remain available offline.

---

## Undo

```
noah undo
```

Rollback installations.

---

## Diff Viewer

Preview file changes before installation.

---

## Sandbox Mode

```
noah try laravel-enterprise
```

Temporary installation.

---

## Templates

```
noah new saas
```

Generates

- rules
- prompts
- documentation
- project structure

---

# Success Metrics

## Developer Experience

- Install in under 30 seconds
- Search in under 200ms
- Keyboard-only workflow
- Zero configuration
- Beautiful terminal output

---

## Community

- Public package registry
- Verified maintainers
- Community publishing
- Ratings
- Downloads
- Trending

---

## Enterprise

- Team configuration
- Lockfiles
- Private registries
- Workspace sync
- Compliance

---

# Positioning

Not

> A registry for Cursor rules.

Not

> A prompt repository.

Instead

> **The package manager for AI-assisted software development.**

Developers should think of Noah the same way they think of:

- npm for JavaScript packages
- Homebrew for system tools
- Docker for containers

But for **AI-powered developer workflows, coding standards, prompts, commands, rules, templates, and best practices.**

---

# North Star

A developer should be able to clone a repository and run:

```bash
noah bootstrap
```

Within one minute, Noah should:

- Detect the technology stack
- Recommend best practices
- Install AI assistant configurations
- Configure project rules
- Sync team standards
- Prepare documentation
- Set up workflows

Result:

A fully AI-optimised development environment with virtually zero manual configuration.
