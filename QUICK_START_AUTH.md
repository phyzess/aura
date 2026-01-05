# Quick Start: Authentication Setup

This is a quick guide to get authentication working. For detailed instructions, see `docs/auth-setup.md`.

## Minimum Setup (Email/Password Only)

If you just want basic email/password authentication without OAuth:

1. **Create KV Namespace**
   ```bash
   cd apps/api
   wrangler kv namespace create "AUTH_KV"
   ```

2. **Update wrangler.toml**

   Replace the KV namespace ID in `apps/api/wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "AUTH_KV"
   id = "YOUR_KV_NAMESPACE_ID_HERE"  # Replace with actual ID from step 1
   ```

3. **Set Up Local Secrets**

   Create `.dev.vars` file for local development:
   ```bash
   cd apps/api
   cp .dev.vars.example .dev.vars
   ```

   Edit `.dev.vars` and set your authentication secret:
   ```bash
   # Generate a random secret
   openssl rand -base64 32

   # Add to .dev.vars
   BETTER_AUTH_SECRET="paste-the-generated-secret-here"
   ```

   **💡 Note**: For local development, always use `.dev.vars` file, NOT `wrangler secret put` command.

4. **Done!** You can now use email/password authentication.

## Add Google OAuth (Recommended)

1. **Create Google OAuth App**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create project → Enable Google+ API → Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:8787/api/auth/callback/google`

2. **Add Client ID to wrangler.toml**

   Edit `apps/api/wrangler.toml`:
   ```toml
   [vars]
   GOOGLE_CLIENT_ID = "your-id.apps.googleusercontent.com"
   ```

3. **Add Client Secret to .dev.vars**

   Edit `apps/api/.dev.vars`:
   ```bash
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

   **💡 Note**: Don't use `wrangler secret put` for local development, just edit `.dev.vars`.

4. **Done!** Google login button will now work.

## Add GitHub OAuth (Recommended)

1. **Create GitHub OAuth App**
   - Go to [GitHub Settings](https://github.com/settings/developers) → OAuth Apps
   - Create new app
   - Add callback URL: `http://localhost:8787/api/auth/callback/github`

2. **Add Client ID to wrangler.toml**

   Edit `apps/api/wrangler.toml`:
   ```toml
   [vars]
   GITHUB_CLIENT_ID = "your-github-client-id"
   ```

3. **Add Client Secret to .dev.vars**

   Edit `apps/api/.dev.vars`:
   ```bash
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   ```

   **💡 Note**: Don't use `wrangler secret put` for local development, just edit `.dev.vars`.

4. **Done!** GitHub login button will now work.

## Add Turnstile (Optional, for Bot Protection)

1. **Create Turnstile Site**
   - Go to Cloudflare Dashboard → Zero Trust → Turnstile
   - Add site with domain `localhost` for development

2. **Add Secret to .dev.vars**

   Edit `apps/api/.dev.vars`:
   ```bash
   TURNSTILE_SECRET_KEY="your-turnstile-secret-key"
   ```

3. **Done!** Bot protection is now active.

## Production Setup

1. **Update Production Configuration**

   Edit `apps/api/wrangler.toml`:
   ```toml
   [env.production.vars]
   BETTER_AUTH_URL = "https://your-api-domain.com"
   BETTER_AUTH_TRUSTED_ORIGINS = "chrome-extension://YOUR_EXTENSION_ID"

   # Only set these if production uses DIFFERENT OAuth apps than development
   # If using the same OAuth apps, these will inherit from [vars] automatically
   # GOOGLE_CLIENT_ID = "your-production-google-id.apps.googleusercontent.com"
   # GITHUB_CLIENT_ID = "your-production-github-id"
   ```

2. **Set Production Secrets**

   ```bash
   cd apps/api

   # Required: Authentication secret
   wrangler secret put BETTER_AUTH_SECRET --env production
   # Enter a random string (at least 32 characters)

   # Optional: Only if using OAuth
   # Note: If dev and production share the same OAuth app, use the same secrets
   wrangler secret put GOOGLE_CLIENT_SECRET --env production
   wrangler secret put GITHUB_CLIENT_SECRET --env production

   # Optional: Only if using Turnstile
   wrangler secret put TURNSTILE_SECRET_KEY --env production
   ```

   **💡 Tip**: For better security, create separate OAuth apps for production with different Client IDs and Secrets.

3. **Create Production KV Namespace**

   ```bash
   wrangler kv namespace create "AUTH_KV" --env production
   ```

   Update `apps/api/wrangler.toml`:
   ```toml
   [[env.production.kv_namespaces]]
   binding = "AUTH_KV"
   id = "your-production-kv-id"  # Replace with actual ID
   ```

4. **Deploy**

   ```bash
   pnpm deploy:api
   ```

## Testing

1. **Start API**
   ```bash
   pnpm dev:api
   ```

2. **Start Extension**
   ```bash
   pnpm dev:extension
   ```

3. **Test Login**
   - Open extension
   - Click "Sign In"
   - Try email/password or social login buttons

## Troubleshooting

**OAuth not working?**
- Check callback URLs match exactly
- Verify client IDs and secrets are correct
- Check `BETTER_AUTH_TRUSTED_ORIGINS` includes your extension origin

**Email not sending?**
- MailChannels is free but may have rate limits
- Check Cloudflare Workers logs for errors

**KV errors?**
- Verify KV namespace ID is correct
- Make sure you created the namespace with `wrangler kv namespace create` (note: space, not colon)

## Next Steps

- See `docs/auth-setup.md` for detailed configuration
- See `AUTHENTICATION_UPDATE.md` for technical details
- See `README.md` for general project setup

