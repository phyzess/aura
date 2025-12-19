## Aura

Aura is a tab and workspace manager that lives as a Chrome extension and syncs data through a Cloudflare Worker API.

The repo is a pnpm monorepo with:

- A Cloudflare Worker API used for auth and sync
- A React + Vite + CRXJS Chrome extension
- Shared domain and configuration packages

---

## Monorepo layout

- `apps/api` – Cloudflare Worker API (Hono + Better Auth + Drizzle ORM + D1)
- `apps/extension` – Chrome extension (React, Vite, CRXJS, Tailwind, Jotai)
- `packages/domain` – shared domain types (User, Workspace, Collection, TabItem, SyncPayload)
- `packages/config` – shared environment schema and typed config (Valibot)

````text
apps/
  api/         # Worker API entry and routes
  extension/   # Extension UI, popup, dashboard, content scripts

packages/
  domain/      # Shared domain models used by API and extension
  config/      # Env schemas + AppConfig / ClientConfig
````

---

## Tech stack

- **API**: Cloudflare Workers, Hono, Better Auth (+ better-auth-cloudflare), D1 (SQLite) via Drizzle ORM
- **Extension**: React 19, Vite 7, CRXJS, Tailwind CSS 4, Jotai
- **Config**: Valibot schemas in `@aura/config` shared across API and extension

---

## Environment & configuration

Environment is treated as data, not hard‑coded defaults. All critical values are validated at startup/build time.

### API (Cloudflare Worker)

The Worker binds these variables (see `apps/api/src/index.ts`):

- `BETTER_AUTH_SECRET` – auth secret (must be set via Cloudflare Secrets)
- `BETTER_AUTH_URL` – public base URL of the auth endpoints
- `BETTER_AUTH_TRUSTED_ORIGINS` – comma‑separated list of allowed origins (e.g. extension and local dev UI)

`@aura/config` exposes a Valibot schema and `buildWorkerConfig(env)` helper. `apps/api/src/auth/config.ts` parses the Worker `Env` into a typed `AppConfig`. Missing or empty values will throw at runtime when `createAuth` is constructed, so a misconfigured Worker fails fast.

Defaults for local development live in `apps/api/wrangler.toml` under `[vars]`. Production values belong in `[env.production.vars]` and in the Cloudflare dashboard / `wrangler secret`.

### Extension (Vite + CRXJS)

The extension uses a single environment variable:

- `VITE_API_BASE_URL` – base URL of the API (exposed to the client by Vite)

The runtime API base URL is centralized in `apps/extension/src/config/env.ts`, which calls `buildClientConfigFromViteEnv(import.meta.env)` from `@aura/config` and exports `API_BASE_URL` for the rest of the extension.

`apps/extension/vite.config.ts` uses Valibot to validate `process.env.VITE_API_BASE_URL` before Vite processes the config. If it is missing or empty, `vite dev` / `vite build` will fail with a clear error.

For detailed environment docs and examples, see `docs/env.md` and `.env.example`.

For a step-by-step setup guide, see `docs/quickstart.md`.

---

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Cloudflare account and D1 database (required when you want the API to talk to a real DB)

### Install dependencies

````bash
pnpm install
````

### Configure environment

Start from the example file and adjust values as needed:

````bash
cp .env.example .env.local
````

Then:

- Ensure `VITE_API_BASE_URL` points to your API (for local dev, `http://localhost:8787`)
- For the API:

  - Configure `BETTER_AUTH_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` in `apps/api/wrangler.toml` (dev) and/or Cloudflare vars (prod)
  - Configure `BETTER_AUTH_SECRET` via Cloudflare Secrets using `wrangler secret put` (for both dev and prod)

---

## Running in development

### API (Cloudflare Worker)

From the repo root:

````bash
pnpm dev:api
````

This runs `wrangler dev` for `apps/api`, using the bindings defined in `apps/api/wrangler.toml`.

If you need to debug against the production configuration (same bindings and D1 as prod):

````bash
pnpm dev:api:prod
````

This runs `wrangler dev --env production`, so it talks to the real production resources.

### Extension

From the repo root:

````bash
pnpm dev
````

This runs the Vite dev server for the extension (`apps/extension`). CRXJS takes care of serving the extension files. Follow the CRXJS docs for adding the dev extension to Chrome during development.

---

## Building & releasing

### Extension bundle

To build the extension for production and generate a zip suitable for the Chrome Web Store:

````bash
pnpm build
````

This runs `pnpm --filter @aura/extension build`, which:

- Type‑checks the project via `tsc -b ../../tsconfig.json`
- Runs `vite build` with the CRXJS plugin
- Emits a zip archive at `apps/extension/release/crx-aura-<version>.zip`

### API deployment (Cloudflare)

From the repo root:

````bash
pnpm deploy:api
````

This forwards to `wrangler deploy --env production` in `apps/api`, using the `production` environment from `wrangler.toml`.

To keep the production D1 schema in sync with your code, apply migrations via:

````bash
pnpm db:migrate:remote
````

This runs `wrangler d1 migrations apply aura-db --env production --remote`.

---

## Conventions

- Application code reads configuration objects, not raw environment variables
- All critical env values are validated via Valibot (either in `@aura/config` or in `vite.config.ts`)
- Secrets are never committed; `.env.*` files are ignored and only `.env.example` is checked in

If you extend the system (new services or apps), prefer adding new fields to `@aura/config` and reusing the existing validation pattern.
