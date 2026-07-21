---
description: React client-side SPA rules for dashboards and admin apps that talk to a Laravel API
globs: "**/*.{tsx,ts,jsx,js}"
alwaysApply: false
---

# React SPA Dashboard

Use this rule for **client-side SPA dashboards** (Vite + React + TypeScript). The UI is a SPA; the backend is a separate **Laravel API**. Do not introduce Next.js App Router, SSR, or server components here.

Sources synthesized from [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) (`react.mdc`, `typescript-react`, `react-query`) and modern SPA practice.

## Architecture

- Treat this app as a **browser SPA** only — no SSR, no `app/` router, no RSC.
- Call the Laravel API over HTTPS with a typed client (`fetch` / axios / ky).
- Prefer feature folders over dumping everything in `components/`.

Suggested structure:

```text
src/
  app/              # providers, router, layout shell
  features/         # domain features (auth, users, billing…)
    <feature>/
      api/
      components/
      hooks/
      types.ts
  shared/           # ui primitives, utils, config
  pages/ or routes/ # route-level screens
```

## Components & TypeScript

- Functional components only; keep them small and focused.
- Prefer explicit props interfaces; avoid `React.FC` unless needed.
- Extract reusable logic into custom hooks.
- Use composition over inheritance; co-locate feature UI with its hooks/api.
- Strict TypeScript; avoid `any`.

## Data fetching (dashboard)

- Use **TanStack Query (React Query)** for server state.
- Put `QueryClientProvider` at the root.
- Custom hooks for queries/mutations (`useUsersQuery`, `useUpdateUserMutation`).
- Stable query keys; invalidate after mutations.
- Handle loading, empty, and error states explicitly.
- Prefer optimistic updates only when rollback is safe.

## Auth & API boundary

- Store tokens/session per project convention (httpOnly cookie preferred when Laravel Sanctum SPA cookie auth is used; otherwise Bearer token with secure storage).
- Centralize API base URL via `import.meta.env`.
- Never hardcode secrets; never commit `.env`.
- Map Laravel validation errors (`422`) into form field errors.

## UI & UX for dashboards

- Tables, filters, and forms should be keyboard-accessible.
- Use controlled forms; libraries (React Hook Form + Zod) for complex forms.
- Show skeleton/loading states for slow endpoints.
- Route-level code splitting with `React.lazy` / dynamic import when screens are heavy.

## State

- Local UI state: `useState` / `useReducer`.
- Server state: TanStack Query — not Redux.
- Cross-cutting client UI state (theme, sidebar): lightweight store (Zustand) or context — only when props become painful.

## Do not

- Do not add Next.js, Nuxt, or Laravel Blade into this SPA.
- Do not put business rules that belong on the API into the client.
- Do not fetch without caching strategy on list/detail dashboard screens.
