## Aura

Aura is a tab and workspace manager that lives as a Chrome extension and syncs data through a Cloudflare Worker API.

### Key Features

- 📑 **Workspace & Collection Management** – Organize tabs into workspaces and collections
- 🔄 **Cross-device Sync** – Sync your data across devices via Cloudflare Worker API
- 🔐 **Multiple Auth Methods** – Email/password, Google OAuth, GitHub OAuth, and email verification
- 🆕 **New Tab Override** – Replace Chrome's new tab page with Aura dashboard for instant access
- 🔍 **Quick Search** – Search all saved tabs with `Cmd+K` (or `Ctrl+K`)
- 💾 **Offline Support** – Works offline with IndexedDB local storage
- 🌐 **i18n** – Multi-language support (English, 中文)
- 🎨 **Dark Mode** – Beautiful dark/light theme support
- 📤 **Import/Export** – Export workspaces, collections, or all data as JSON
- 🛡️ **Bot Protection** – Cloudflare Turnstile integration for security

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

**Required:**
- `BETTER_AUTH_SECRET` – auth secret (must be set via Cloudflare Secrets)
- `BETTER_AUTH_URL` – public base URL of the auth endpoints
- `BETTER_AUTH_TRUSTED_ORIGINS` – comma‑separated list of allowed origins (e.g. extension and local dev UI)

**Optional (for OAuth and security features):**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – Google OAuth credentials
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` – GitHub OAuth credentials
- `TURNSTILE_SECRET_KEY` – Cloudflare Turnstile secret for bot protection

**Cloudflare Bindings:**
- `DB` – D1 database binding
- `AUTH_KV` – KV namespace for verification codes

`@aura/config` exposes a Valibot schema and `buildWorkerConfig(env)` helper. `apps/api/src/auth/config.ts` parses the Worker `Env` into a typed `AppConfig`. Missing or empty values will throw at runtime when `createAuth` is constructed, so a misconfigured Worker fails fast.

Defaults for local development live in `apps/api/wrangler.toml` under `[vars]`. Production values belong in `[env.production.vars]` and in the Cloudflare dashboard / `wrangler secret`.

For detailed authentication setup, see [Authentication Setup Guide](docs/guides/auth-setup.md).

### Extension (Vite + CRXJS)

The extension uses a single environment variable:

- `VITE_API_BASE_URL` – base URL of the API (exposed to the client by Vite)

The runtime API base URL is centralized in `apps/extension/src/config/env.ts`, which calls `buildClientConfigFromViteEnv(import.meta.env)` from `@aura/config` and exports `API_BASE_URL` for the rest of the extension.

`apps/extension/vite.config.ts` uses Valibot to validate `process.env.VITE_API_BASE_URL` before Vite processes the config. If it is missing or empty, `vite dev` / `vite build` will fail with a clear error.

For detailed environment docs and examples, see [Environment Setup](docs/development/env.md) and `.env.example`.

For a step-by-step setup guide, see [Quick Start Guide](docs/getting-started/quickstart.md).

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

## Database maintenance

There are two helper scripts for resetting the D1 database used by the API. Both live under `scripts/` and use `wrangler d1 execute` under the hood.

### Local database reset (safe)

- **Script**: `scripts/clear-db-local.sh`
- **Target**: local D1 instance (`--local`)
- **What it does**: deletes all rows from auth tables (`users`, `sessions`, `accounts`, `verifications`) and app tables (`workspaces`, `collections`, `tabs`).
- **Usage**:

  ````bash
  ./scripts/clear-db-local.sh
  ```

  You must type `LOCAL` when prompted, otherwise the script aborts.

This script is intended for local development only (e.g. when you want a clean slate for testing).

### Remote production database reset (dangerous)

> **DANGER**: `scripts/clear-db-remote.sh` irreversibly deletes **all data** from the production D1 database (`aura-db`) using `--env production --remote`. Do not wire this into CI or any automated job.

- **Script**: `scripts/clear-db-remote.sh`
- **Target**: remote production D1 (`aura-db`)
- **What it does**: same deletes as the local script, but against the production database.
- **Usage (manual only)**:

  ````bash
  ./scripts/clear-db-remote.sh
  ```

  The script requires **three separate confirmations**:

  1. Type `PROD`
  2. Type the database name `aura-db`
  3. Type `DELETE EVERYTHING`

  If any confirmation does not match exactly, the script aborts without touching the database.

Only run this script when you fully understand the impact and have confirmed that it is safe to wipe all production data (for example, during early internal testing).

---

### Quick release commands

For a typical release of the extension + API:

1. Record changes:
   - `pnpm changeset`
2. On `main`, bump versions and changelogs:
   - `pnpm changeset:version`
3. Build artifacts:
   - `pnpm build:extension`
4. Deploy API (if needed):
   - `pnpm deploy:api`

For the full release guide and detailed checklist, see [Release Process](docs/development/release.md).

---

## 📚 Documentation

- **[Documentation Index](docs/README.md)** - Complete documentation overview
- **[Quick Start Guide](docs/getting-started/quickstart.md)** - Get started in 5 minutes
- **[Authentication Setup](docs/guides/auth-setup.md)** - Configure auth providers
- **[API Documentation](apps/api/README.md)** - API architecture and development
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute

### Language Support

Most guides are available in both English and Chinese (中文):
- English: `*.md`
- 中文: `*.zh-CN.md`

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Setting up your development environment
- Code style and conventions
- Testing requirements
- Pull request process

---

## 📄 License

[MIT License](LICENSE) - see LICENSE file for details

---

## Conventions

- Application code reads configuration objects, not raw environment variables
- All critical env values are validated via Valibot (either in `@aura/config` or in `vite.config.ts`)
- Secrets are never committed; `.env.*` files are ignored and only `.env.example` is checked in

If you extend the system (new services or apps), prefer adding new fields to `@aura/config` and reusing the existing validation pattern.
