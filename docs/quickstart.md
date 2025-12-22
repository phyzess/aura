# Aura Quick Start

This guide shows the minimal steps to run Aura in local development and to prepare for production, following **方案 B：BETTER_AUTH_SECRET 只通过 Cloudflare Secrets 配置**。

---

## 1. Prerequisites

- Node.js 20+
- pnpm 10+
- A Cloudflare account and a D1 database (for the API)

From the repo root:

````bash
pnpm install
````

---

## 2. Configure local environment

### 2.1 Extension (Vite + React)

1. At the **repo root**, create a local env file from the example:

````bash
cp .env.example .env.local
````

2. Open the root-level `.env.local` and set the API URL for local dev:

````bash
VITE_API_BASE_URL=http://localhost:8787
````

> This is the only place you need to set `VITE_API_BASE_URL` for local development. It tells the extension to talk to your local Worker at `http://localhost:8787`.

### 2.2 API (Cloudflare Worker dev)

1. Open `apps/api/wrangler.toml` and in the top-level `[vars]` section set non-secret values, for example:

	````toml
	[vars]
	BETTER_AUTH_URL = "http://localhost:8787"
	BETTER_AUTH_TRUSTED_ORIGINS = "http://localhost:5173,chrome-extension://*"
	````

2. In the `apps/api` directory, create a `.dev.vars` file for **local dev secrets** (kept out of Git):

	````bash
	# apps/api/.dev.vars
	BETTER_AUTH_SECRET=your-dev-secret-here
	````

	Wrangler will automatically load `.dev.vars` when you run `wrangler dev` locally. For production (and any remote dev environments), configure `BETTER_AUTH_SECRET` via Cloudflare Secrets instead (see below).

---

## 3. Run in development

Open two terminals in the repo root.

### 3.1 Start the API (Worker dev)

````bash
pnpm dev:api
````

- This runs `wrangler dev` with config from `apps/api/wrangler.toml`.
- If any of `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, or `BETTER_AUTH_TRUSTED_ORIGINS` are missing/invalid, the Valibot schema in `@aura/config` will throw at auth initialization.

If you need to debug using the production configuration (same bindings and D1 as prod), temporarily run:

````bash
pnpm dev:api:prod
````

This runs `wrangler dev --env production` and talks to real production resources, so use it with care.

### 3.2 Start the Extension dev server

````bash
pnpm dev
````

- Runs the Vite dev server for `apps/extension`.
- `VITE_API_BASE_URL` is validated in `vite.config.ts` using Valibot; if missing, `vite dev` will fail early.
- Follow CRXJS docs to load the dev extension into Chrome from the Vite dev server.

---

## 4. Build for production

### 4.1 API (Cloudflare Worker production)

1. In `apps/api/wrangler.toml` under `[env.production.vars]`, configure **non-secret** vars (or set the same values in Cloudflare Dashboard):

   - `BETTER_AUTH_URL` – your public API URL (e.g. `https://aura-api.your-domain.com`)
   - `BETTER_AUTH_TRUSTED_ORIGINS` – comma-separated list of allowed origins (e.g. your published Chrome extension origin)

2. Configure the **production secret** via Cloudflare Secrets:

````bash
pnpm --filter @aura/api wrangler secret put BETTER_AUTH_SECRET --env production
````

3. Deploy the Worker:

````bash
pnpm deploy:api
````

4. When you change the schema, apply D1 migrations to the production database:

````bash
pnpm db:migrate:remote
````

This runs `wrangler d1 migrations apply aura-db --env production --remote`.

### 4.2 Extension bundle

1. At the **repo root**, create or update `.env.production` so it points to your deployed API:

````bash
VITE_API_BASE_URL=https://aura-api.your-domain.com
````

   Alternatively, you can `export VITE_API_BASE_URL=...` before running the build.

2. From the repo root, build the extension:

````bash
pnpm build
````

This runs the `@aura/extension` TypeScript build and `vite build` with CRXJS. On success, a zip archive is written to:

````text
apps/extension/release/crx-aura-<version>.zip
````

You can upload this zip to the Chrome Web Store or load it unpacked from Chrome for final verification.

---

## 5. Where to look next

- `docs/env.md` – detailed explanation of environment variables and how `@aura/config` validates them
- `docs/release.md` – end-to-end release guide (versioning with Changesets, building the extension zip, deploying the API)
- `README.md` – high-level overview of the architecture and project layout
