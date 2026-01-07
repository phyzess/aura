# Aura API

Cloudflare Workers API for Aura tab manager - handles authentication and cross-device sync.

## Overview

The Aura API is a serverless API built on Cloudflare Workers that provides:

- **Authentication** - Email/password, Google OAuth, GitHub OAuth via Better Auth
- **Data Sync** - Cross-device synchronization using Cloudflare D1 (SQLite)
- **User Management** - User profiles and session management

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono (lightweight web framework)
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth + better-auth-cloudflare
- **Language**: TypeScript

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+
- Cloudflare account
- Wrangler CLI

### Installation

```bash
# Install dependencies (from repo root)
pnpm install

# Navigate to API directory
cd apps/api
```

### Local Development

```bash
# Start development server
pnpm dev

# The API will be available at http://localhost:8787
```

### Database Setup

```bash
# Generate migration files
pnpm db:generate

# Apply migrations locally
pnpm db:migrate:local

# Apply migrations to production
pnpm db:migrate:remote
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test pull.integration.test.ts

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck
```

## Project Structure

```
apps/api/
├── src/
│   ├── routes/          # HTTP route definitions
│   ├── handlers/        # Request handlers
│   ├── data/            # Data access layer
│   ├── db/              # Database schemas
│   ├── auth/            # Authentication logic
│   ├── types/           # TypeScript types
│   └── index.ts         # Entry point
├── __tests__/           # Integration tests
├── docs/                # Documentation
│   ├── architecture.md  # Architecture overview
│   ├── data-layer.md    # Data layer API docs
│   └── testing.md       # Testing guide
├── migrations/          # Database migrations
└── wrangler.toml        # Cloudflare Workers config
```

## Documentation

- [Architecture Overview](./docs/architecture.md) - System design and architecture
- [Data Layer API](./docs/data-layer.md) - Database access layer documentation
- [Testing Guide](./docs/testing.md) - How to write and run tests

## API Endpoints

### Authentication

- `POST /api/auth/sign-up` - Create new account
- `POST /api/auth/sign-in` - Sign in with email/password
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session

### Sync

- `POST /api/sync/pull` - Pull data from server
- `POST /api/sync/push` - Push data to server

### User

- `GET /api/user/me` - Get current user profile

## Environment Variables

See [Environment Setup Guide](../../docs/development/env.md) for detailed configuration.

Required variables:
- `BETTER_AUTH_SECRET` - Auth encryption secret
- `BETTER_AUTH_URL` - Auth callback URL
- `DATABASE_URL` - D1 database connection (auto-configured)

Optional OAuth variables:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

## Deployment

```bash
# Deploy to production
pnpm deploy

# The API will be deployed to your Cloudflare Workers
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm deploy` - Deploy to production
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate:local` - Apply migrations locally
- `pnpm db:migrate:remote` - Apply migrations to production
- `pnpm test` - Run tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm typecheck` - Type check

## Contributing

See the main [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

See [LICENSE](../../LICENSE) in the repository root.

