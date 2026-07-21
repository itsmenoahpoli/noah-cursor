---
description: Nuxt rules for marketing and branding websites (SEO, content, Vue Composition API)
globs: "**/*.{vue,ts,js,mjs}"
alwaysApply: false
---

# Nuxt Marketing / Branding

Use this rule for **marketing and branding websites** built with Nuxt 3+. Optimize for SEO, content pages, and brand experiences — not authenticated SPA dashboards.

Sources synthesized from [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) (`vue-3-nuxt-3-typescript`, `vue3-composition-api`).

## When to use Nuxt here

- Marketing sites, landings, brand sites, content-heavy Vue stacks.
- Prefer Nuxt's SSR/SSG and SEO utilities.
- Dashboard/admin apps should use the **React SPA** rule + Laravel API instead (unless the team explicitly chooses a Nuxt SPA dashboard).

## Nuxt conventions

- Vue 3 **Composition API** with `<script setup lang="ts">`.
- Use Nuxt file-based routing, layouts, plugins, and middleware.
- Prefer auto-imported composables; keep shared logic in `composables/`.
- Runtime config for public/private env (`useRuntimeConfig`) — never hardcode secrets.
- Tailwind (or project design system) for styling; keep utility usage consistent.

## SEO & content

- Use `useSeoMeta` / `useHead` (or Nuxt SEO module) on every public page.
- Semantic HTML and accessible navigation.
- Prefer SSG/ISR-style rendering for mostly static marketing pages.
- Optimize images (Nuxt Image) and fonts.

## Data fetching

- Prefer `useAsyncData` / `useFetch` with clear keys.
- Cache and refresh intentionally; avoid waterfall client fetches for hero content.
- If consuming the Laravel API for public content, keep private credentials on the server.

## Performance

- Lazy-load non-critical client islands.
- Keep marketing pages lean — minimize client-only plugins.
- Review payload size for route data.

## Do not

- Do not default to a client-only SPA mode for public brand pages.
- Do not mix React dashboard patterns into Nuxt marketing code.
- Do not skip SEO meta on indexable pages.
