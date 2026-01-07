# Secrets and Environment Variables Guide

This guide explains the difference between environment variables and secrets, and how to configure them properly.

## 🔐 What's the Difference?

### Environment Variables (Public)
- **Stored in**: `wrangler.toml`
- **Visibility**: Visible in code repository
- **Use for**: Non-sensitive configuration
- **Examples**: URLs, Client IDs, feature flags

### Secrets (Private)
- **Stored in**: `.dev.vars` (local) or Cloudflare Secrets (production)
- **Visibility**: Never visible after being set
- **Use for**: Sensitive data like passwords, API keys, tokens
- **Examples**: Client Secrets, API tokens, encryption keys

## 📋 Configuration Matrix

| Variable | Type | Local Storage | Production Storage | Safe to Commit? |
|----------|------|---------------|-------------------|-----------------|
| `BETTER_AUTH_URL` | Public | `wrangler.toml` | `wrangler.toml` | ✅ Yes |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Public | `wrangler.toml` | `wrangler.toml` | ✅ Yes |
| `GOOGLE_CLIENT_ID` | Public | `wrangler.toml` | `wrangler.toml` | ✅ Yes |
| `GITHUB_CLIENT_ID` | Public | `wrangler.toml` | `wrangler.toml` | ✅ Yes |
| `BETTER_AUTH_SECRET` | Secret | `.dev.vars` | `wrangler secret` | ❌ No |
| `GOOGLE_CLIENT_SECRET` | Secret | `.dev.vars` | `wrangler secret` | ❌ No |
| `GITHUB_CLIENT_SECRET` | Secret | `.dev.vars` | `wrangler secret` | ❌ No |
| `TURNSTILE_SECRET_KEY` | Secret | `.dev.vars` | `wrangler secret` | ❌ No |

## 🛠️ Setup Instructions

### Local Development

1. **Create `.dev.vars` file**:
   ```bash
   cd apps/api
   cp .dev.vars.example .dev.vars
   ```

2. **Add secrets to `.dev.vars`**:
   ```bash
   # Required
   BETTER_AUTH_SECRET="your-secret-at-least-32-chars"
   
   # Optional: Only if using OAuth
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   TURNSTILE_SECRET_KEY="your-turnstile-secret"
   ```

3. **Add public config to `wrangler.toml`**:
   ```toml
   [vars]
   BETTER_AUTH_URL = "http://localhost:8787"
   BETTER_AUTH_TRUSTED_ORIGINS = "http://localhost:5173,chrome-extension://*"
   
   # Optional: Only if using OAuth
   GOOGLE_CLIENT_ID = "your-google-client-id"
   GITHUB_CLIENT_ID = "your-github-client-id"
   ```

### Production Deployment

1. **Set secrets using Wrangler CLI**:
   ```bash
   cd apps/api
   
   # Required
   wrangler secret put BETTER_AUTH_SECRET --env production
   
   # Optional: Only if using OAuth
   wrangler secret put GOOGLE_CLIENT_SECRET --env production
   wrangler secret put GITHUB_CLIENT_SECRET --env production
   wrangler secret put TURNSTILE_SECRET_KEY --env production
   ```

2. **Add public config to `wrangler.toml`**:
   ```toml
   [env.production.vars]
   BETTER_AUTH_URL = "https://your-api-domain.com"
   BETTER_AUTH_TRUSTED_ORIGINS = "chrome-extension://your-extension-id"

   # Only set these if production uses DIFFERENT OAuth apps than development
   # If using the same OAuth apps, these will inherit from [vars] automatically
   # GOOGLE_CLIENT_ID = "your-production-google-client-id"
   # GITHUB_CLIENT_ID = "your-production-github-client-id"
   ```

## 🔄 Configuration Inheritance

Cloudflare Workers uses configuration inheritance:
- `[env.production.vars]` inherits all values from `[vars]`
- Only override in `[env.production.vars]` if production needs different values

### Example: Same OAuth App for Dev and Production

```toml
[vars]
GITHUB_CLIENT_ID = "Ov23liqER5n9iRD0qAAO"

[env.production.vars]
BETTER_AUTH_URL = "https://your-api-domain.com"
# GITHUB_CLIENT_ID is automatically inherited, no need to repeat
```

### Example: Different OAuth Apps (Recommended)

```toml
[vars]
GITHUB_CLIENT_ID = "Ov23li...dev-app-id"

[env.production.vars]
BETTER_AUTH_URL = "https://your-api-domain.com"
GITHUB_CLIENT_ID = "Ov23li...prod-app-id"  # Override for production
```

## ⚠️ Security Best Practices

1. **Never commit `.dev.vars`** - It's already in `.gitignore`
2. **Never put secrets in `wrangler.toml`** - Use `wrangler secret put` instead
3. **Client IDs are public** - They identify your app, not authenticate it
4. **Client Secrets are private** - They prove your app's identity
5. **Rotate secrets regularly** - Especially if they might be compromised
6. **Use different OAuth apps for dev/prod (recommended)** - Better security isolation
7. **If sharing OAuth apps** - Use the same secrets, but understand the security implications

## 🔄 Updating Secrets

### Local Development
Just edit `.dev.vars` and restart the dev server.

### Production
Use `wrangler secret put` to update:
```bash
wrangler secret put BETTER_AUTH_SECRET --env production
```

## ❓ FAQ

### Q: Do I need to run `wrangler secret put` for local development?
**A: No!** For local development, only use `.dev.vars` file. The `wrangler secret put` command is **only for production**.

### Q: Why can't I use `wrangler secret put` locally?
**A: You can, but you shouldn't.** Secrets set with `wrangler secret put` are stored in Cloudflare's servers and are meant for production. For local development, `.dev.vars` is simpler and faster to update.

### Q: Do I need to set Client IDs in both `[vars]` and `[env.production.vars]`?
**A: Only if they're different.** If you use the same OAuth app for dev and production, set it once in `[vars]` and it will automatically inherit to production.

### Q: Can I commit Client IDs to git?
**A: Yes!** Client IDs are public identifiers. Only Client **Secrets** must be kept private.

## 📚 Related Documentation

- [Cloudflare Workers Environment Variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Quick Start Guide](../QUICK_START_AUTH.md)
- [Authentication Setup](./auth-setup.md)

