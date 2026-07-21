---
description: Stack selection rule for React SPA dashboards, Laravel APIs, and Next/Nuxt marketing sites
alwaysApply: false
---

# Noah Stack Architecture

Use this when choosing or mixing frontends and backends in Noah Poli projects.

## Default split

| Surface | Stack | Rule to apply |
|---------|-------|---------------|
| Dashboard / admin (authenticated SPA) | **React** client-side SPA (Vite) | `react-spa-dashboard` |
| Backend API | **Laravel** API-only | `laravel-api` |
| Marketing / branding / content site | **Next.js** *or* **Nuxt** | `nextjs-marketing` / `nuxt-marketing` |

## Principles

1. Dashboards are **SPAs** talking to Laravel over JSON — not Inertia/Livewire unless requested.
2. Marketing sites prioritize **SEO and content**; pick Next or Nuxt per team preference, not both in one site.
3. Keep API contracts stable; version when breaking.
4. Do not force dashboard auth patterns onto public marketing pages.
5. Share design tokens/brand guidelines across marketing and dashboard when possible, but keep codebases/boundaries clear.

## Sources

Curated from community Cursor rules (notably [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules)) and adapted to this architecture.
