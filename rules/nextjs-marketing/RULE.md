---
description: Next.js rules for marketing and branding websites (SEO, App Router, content pages)
globs: "**/*.{tsx,ts,jsx,js,mdx}"
alwaysApply: false
---

# Next.js Marketing / Branding

Use this rule for **marketing and branding websites** built with Next.js (App Router). Optimize for SEO, performance, and content-driven pages — not authenticated SPA dashboards.

Sources synthesized from [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) (`nextjs-app-router`, `nextjs-14-tailwind-seo`).

## When to use Next.js here

- Marketing sites, landing pages, brand storytelling, blogs, campaigns.
- Prefer SSG/SSR and strong SEO.
- Dashboard/admin apps should use the **React SPA** rule + Laravel API instead.

## App Router defaults

- Server Components by default; add `'use client'` only for interactivity.
- Use `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- Colocate route UI under `app/`; keep shared UI in `components/`.
- Use `next/image` and `next/font`.
- Prefer Tailwind (or the project design system) over ad-hoc CSS.

## SEO & content

- Define `metadata` / `generateMetadata` per page (title, description, Open Graph, Twitter).
- Semantic HTML (`main`, `header`, `nav`, `section`, `article`).
- Accessible landmarks, focus states, and image `alt` text.
- Static generation for mostly-static pages; revalidate when CMS/API content changes.
- Sitemap and `robots.txt` when the site is public.

## Performance

- Avoid shipping large client bundles on marketing pages.
- Lazy-load below-the-fold interactive widgets.
- Keep third-party scripts minimal (analytics via Next script strategy).
- Optimize LCP: hero image priority, restrained font loading.

## Data

- Fetch in Server Components with caching/`revalidate` as appropriate.
- If calling the Laravel API for public content, keep tokens server-side only.
- Do not expose admin credentials to the browser.

## Do not

- Do not turn a marketing site into a full authenticated dashboard SPA inside Next unless explicitly requested.
- Do not use client components for purely static content.
- Do not skip metadata on public pages.
