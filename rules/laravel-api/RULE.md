---
description: Laravel API-only backend rules for SPA dashboards and headless clients
globs: "**/*.php"
alwaysApply: false
---

# Laravel API

Use this rule when Laravel is an **API-only** backend serving a React SPA (or other clients). Prefer JSON APIs over Blade/Livewire/Inertia unless the user explicitly asks for them.

Sources synthesized from [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) (`laravel-php-83`) plus Laravel API conventions (Sanctum, Form Requests, Resources).

## Role of this app

- Laravel exposes **REST/JSON endpoints** (or thin action controllers).
- The React dashboard is the primary UI client.
- Marketing sites (Next/Nuxt) may call public read-only endpoints when needed.
- Do not build admin UIs in Blade unless requested.

## PHP & Laravel conventions

- PHP 8.2+ features where appropriate (typed properties, enums, readonly, constructor promotion).
- Follow PSR-12 and Laravel naming:
  - Classes: PascalCase
  - Methods: camelCase
  - DB columns / request keys: snake_case (or consistently camelCase in API resources — pick one and stick to it)
- Prefer helpers when clearer; keep controllers thin.
- Pint for formatting.

## HTTP layer

- Validate with **Form Request** classes — not ad-hoc `$request->validate()` in fat controllers.
- Return **API Resources** / Resource collections for JSON shaping.
- Use API route files (`routes/api.php`) and version when needed (`/api/v1/...`).
- Prefer invokable / single-action controllers for complex endpoints when it improves clarity.
- Consistent error JSON shape for `401`, `403`, `404`, `422`, `500`.

## Auth

- Prefer **Laravel Sanctum** for SPA cookie auth (same-site) or token auth for mobile/third-party.
- Protect routes with `auth:sanctum` (or project guard).
- Authorize with Policies / Gates — never “check role in controller ad hoc” without a policy when domain rules grow.

## Domain & data

- Eloquent models stay focused; push heavy workflows to Actions/Services.
- Use migrations for schema; factories/seeders for local data.
- Eager-load relations to avoid N+1 (`with`, `loadMissing`).
- Database transactions around multi-model writes.
- Queues for email, webhooks, and slow side effects.

## Testing

- Feature tests for API endpoints (`postJson`, `getJson`, assert JSON structure).
- Cover auth boundaries and validation failures.
- Prefer Pest or PHPUnit per project norm.

## Do not

- Do not default to Livewire / Inertia / Blade admin panels for this stack.
- Do not return unfiltered Eloquent models when a Resource is safer.
- Do not put React/Next/Nuxt frontend code into the Laravel repo unless the monorepo already does that by convention.
