# Authentication Setup Guide

This guide explains how to configure authentication providers for Aura.

## Table of Contents

- [Cloudflare KV Setup](#cloudflare-kv-setup)
- [Cloudflare Turnstile Setup](#cloudflare-turnstile-setup)
- [Google OAuth Setup](#google-oauth-setup)
- [GitHub OAuth Setup](#github-oauth-setup)
- [Email Verification](#email-verification)

---

## Cloudflare KV Setup

KV is used to store temporary verification codes for email verification.

### 1. Create KV Namespace

```bash
# For development
wrangler kv namespace create "AUTH_KV"

# For preview (optional)
wrangler kv namespace create "AUTH_KV" --preview
```

### 2. Update wrangler.toml

Replace the placeholder IDs in `apps/api/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "AUTH_KV"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

For production:

```toml
[[env.production.kv_namespaces]]
binding = "AUTH_KV"
id = "your-production-kv-namespace-id"
```

---

## Cloudflare Turnstile Setup

Turnstile provides bot protection for registration and login forms.

### 1. Create Turnstile Site

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Zero Trust → Turnstile
2. Click "Add Site"
3. Configure:
   - **Site name**: Aura
   - **Domain**: Your domain (or `localhost` for development)
   - **Widget mode**: Managed (recommended)
4. Copy the **Site Key** and **Secret Key**

### 2. Configure Environment Variables

Add to `apps/api/wrangler.toml`:

```toml
[vars]
TURNSTILE_SECRET_KEY = "your-turnstile-secret-key"
```

For production, use Cloudflare Secrets:

```bash
wrangler secret put TURNSTILE_SECRET_KEY --env production
```

### 3. Add to Frontend

The site key needs to be added to your extension's environment:

```env
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

---

## Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: 
     - `http://localhost:8787/api/auth/callback/google` (development)
     - `https://your-api-domain.com/api/auth/callback/google` (production)
6. Copy **Client ID** and **Client Secret**

### 2. Configure Environment Variables

For development, add to `apps/api/wrangler.toml`:

```toml
[vars]
GOOGLE_CLIENT_ID = "your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "your-google-client-secret"
```

For production, use Cloudflare Secrets:

```bash
wrangler secret put GOOGLE_CLIENT_ID --env production
wrangler secret put GOOGLE_CLIENT_SECRET --env production
```

---

## GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/developers) → OAuth Apps
2. Click "New OAuth App"
3. Configure:
   - **Application name**: Aura
   - **Homepage URL**: Your app URL
   - **Authorization callback URL**:
     - `http://localhost:8787/api/auth/callback/github` (development)
     - `https://your-api-domain.com/api/auth/callback/github` (production)
4. Copy **Client ID** and **Client Secret**

### 2. Configure Environment Variables

For development, add to `apps/api/wrangler.toml`:

```toml
[vars]
GITHUB_CLIENT_ID = "your-github-client-id"
GITHUB_CLIENT_SECRET = "your-github-client-secret"
```

For production, use Cloudflare Secrets:

```bash
wrangler secret put GITHUB_CLIENT_ID --env production
wrangler secret put GITHUB_CLIENT_SECRET --env production
```

---

## Email Verification

Email verification uses MailChannels, which is free for Cloudflare Workers.

### Configuration

No additional setup required! MailChannels is automatically available in Cloudflare Workers.

### Customization

To customize the sender email, edit `apps/api/src/auth/email.ts`:

```typescript
const fromEmail = options.from?.email || "noreply@your-domain.com";
const fromName = options.from?.name || "Your App Name";
```

---

## Testing

### Local Development

1. Start the API:
   ```bash
   pnpm dev:api
   ```

2. Start the extension:
   ```bash
   pnpm dev:extension
   ```

3. Test OAuth flows by clicking the social login buttons

### Production

1. Deploy the API:
   ```bash
   pnpm deploy:api
   ```

2. Build the extension:
   ```bash
   pnpm build:extension
   ```

---

## Troubleshooting

### OAuth Redirect Issues

- Ensure callback URLs match exactly in OAuth provider settings
- Check `BETTER_AUTH_URL` is set correctly
- Verify `BETTER_AUTH_TRUSTED_ORIGINS` includes your extension origin

### Email Not Sending

- Check Cloudflare Workers logs for errors
- Verify the email address format is valid
- MailChannels may have rate limits

### KV Not Working

- Verify KV namespace is bound correctly in wrangler.toml
- Check KV namespace IDs are correct
- Ensure you've run `wrangler kv namespace create` (note: space, not colon)

