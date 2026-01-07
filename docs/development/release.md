# Release guide

This document describes a practical release flow for the Aura monorepo, focusing on the Chrome extension package `@aura/extension` and using Changesets for versioning.

## 1. Prerequisites

You already have:

- A pnpm workspace with:
  - `apps/extension` (Chrome extension, package name `@aura/extension`)
  - `apps/api` (Cloudflare Worker API)
  - `packages/*` shared libraries
- Changesets configured at the repo root:
  - `.changeset/config.json` with `baseBranch: "main"`
  - Root `package.json` scripts:

    ````bash
    pnpm changeset          # create a changeset
    pnpm changeset:version  # apply queued changesets and bump versions
    ````

- `apps/extension/manifest.config.ts` reading the version from `apps/extension/package.json`.

## 2. Day-to-day workflow with Changesets

### 2.1 After implementing a change

From the repo root, run:

````bash
pnpm changeset
````

Then follow the interactive prompts:

1. Select affected packages (for example: `@aura/extension`, `@aura/config`).
2. Choose the bump type for each affected package:
   - `patch` – bug fix or very small change, no API changes.
   - `minor` – new features that are backwards compatible.
   - `major` – breaking changes.
3. Provide a short summary (used in the changelog).

This will create a new markdown file under `.changeset/` that records which packages will be bumped and how.

Commit your code together with the new `.changeset/*.md` file.

### 2.2 When you are ready to cut a release

On the `main` branch (fast-forwarded with latest changes), run:

````bash
pnpm changeset:version
````

This will:

- Update `version` fields in affected `package.json` files (including `apps/extension/package.json`).
- Generate or update `CHANGELOG.md` files for those packages.
- Clear the processed files under `.changeset/`.

After this step, `@aura/extension`'s version becomes the single source of truth for:

- The Chrome extension manifest version.
- The version embedded in your built CRX zip name (via your Vite/zip naming logic).

Commit the version bump and changelog changes, for example:

````bash
git add .
git commit -m "chore: version packages"
````

After committing the version bump, tag the extension release:

````bash
git tag ext-vX.Y.Z
git push && git push --tags
````

The `ext-v*` prefix is reserved for Chrome extension releases. For example, if `apps/extension/package.json` now has `"version": "1.2.3"`, tag `ext-v1.2.3`.

### 2.3 Tag naming (ext-v / api-v) and CI

We use scoped tags to distinguish different deployable targets in the monorepo:

- `ext-vX.Y.Z` – Chrome extension release, version taken from `apps/extension/package.json.version`.
- `api-vX.Y.Z` – API release, version taken from `apps/api/package.json.version`.

GitHub Actions workflows are wired so that:

- pushing an `ext-v*` tag builds the extension and publishes a GitHub Release with the built zip attached;
- pushing an `api-v*` tag deploys `@aura/api` to Cloudflare Workers via `pnpm deploy:api`.

## 3. Building the Chrome extension for release

With versions bumped via Changesets, build the extension from the repo root:

````bash
pnpm build:extension
````

This will:

- Run the Vite build for `@aura/extension`.
- Use the version from `apps/extension/package.json` in the extension manifest.
- Produce a zip file under `apps/extension/release` whose name includes the extension name and version, plus either:
  - A timestamp, or
  - A custom build metadata suffix supplied via `BUILD_META` / `RELEASE_TAG` env vars (depending on your Vite config).

Examples:

- Simple local build:

  ````bash
  pnpm build:extension
  # => release/crx-<name>-<version>-<timestamp>.zip
  ````

- Release candidate with explicit tag:

  ````bash
  RELEASE_TAG=v1.2.0-rc.1 pnpm build:extension
  # => release/crx-<name>-<version>-v1.2.0-rc.1.zip
  ````

You can then load the unzipped bundle in Chrome for testing, or upload the zip to the Chrome Web Store if/when you decide to publish.

## 4. Releasing the API (Cloudflare Worker)

If your changes also affect the API in `@aura/api`, after bumping versions you can deploy it using the existing script:

````bash
pnpm deploy:api
````

This runs the `deploy` script from `apps/api/package.json` (typically `wrangler deploy --env production`) and will use the production configuration from `apps/api/wrangler.toml`.

## 5. Recommended full release checklist

Putting it all together, a typical release looks like this:

1. Implement and test your changes locally.
2. Record changes:
   - Run `pnpm changeset` and describe the impact.
   - Commit code + changeset files.
3. On `main`, prepare versions:
   - Merge PRs.
   - Run `pnpm changeset:version`.
   - Review changes in `package.json` and `CHANGELOG.md`.
   - Commit with a message like `chore: version packages`.
4. Build artifacts:
   - `pnpm build:extension` to produce the CRX zip.
   - Optionally use `RELEASE_TAG` / `BUILD_META` to give the build a meaningful suffix.
5. Deploy backend (if needed):
   - `pnpm deploy:api` to deploy the Cloudflare Worker API.
6. Tag and push:
   - For the extension: `git tag ext-vX.Y.Z` (matching `apps/extension/package.json.version`).
   - For the API (when deploying): `git tag api-vX.Y.Z` (matching `apps/api/package.json.version`).
   - `git push && git push --tags`.

This flow keeps your versions, changelogs, extension manifest, built artifacts, and deployment automation in sync, while staying simple enough for a small team.

