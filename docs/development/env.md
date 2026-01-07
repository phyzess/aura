# Environment configuration

This project is designed to be open source and deployable as both a Cloudflare Worker API and a Chrome extension. Environment configuration is kept outside of application code wherever possible.

## API (Cloudflare Worker)

The Worker binds the following variables via `apps/api/src/index.ts`:

- `BETTER_AUTH_SECRET` – auth secret. For **local `wrangler dev`**, provide it via a `.dev.vars` file in `apps/api` (see below). For production / remote envs, configure it via Cloudflare Secrets (`wrangler secret put`, do not commit real values).
- `BETTER_AUTH_URL` – public base URL of the auth endpoints (e.g. `http://localhost:8787` in dev, `https://api.your-domain.com` in prod).
- `BETTER_AUTH_TRUSTED_ORIGINS` – comma-separated list of allowed origins that can talk to the auth API.

For local development, set non-secret defaults in `apps/api/wrangler.toml` under `[vars]` (for example `BETTER_AUTH_URL` and `BETTER_AUTH_TRUSTED_ORIGINS`), and create a `.dev.vars` file next to it:

````bash
# apps/api/.dev.vars
BETTER_AUTH_SECRET=your-dev-secret-here
````

Wrangler will automatically load `.dev.vars` when you run `wrangler dev` in local mode. Production values for non-secrets belong in `[env.production.vars]`, while secrets in production (and any remote dev environments) are still provided via Cloudflare dashboard / `wrangler secret`.

## Extension (Vite)

The extension reads:

- `VITE_API_BASE_URL` – base URL of the API, exposed to the client by Vite.

`apps/extension/src/config/env.ts` exposes `API_BASE_URL`, and all code should import from there instead of reading `import.meta.env` directly.

For local development, set this in `.env.development` or `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8787
```

For production builds (e.g. Chrome Web Store bundle), set it to your deployed Worker URL:

```bash
VITE_API_BASE_URL=https://api.your-domain.com
```

