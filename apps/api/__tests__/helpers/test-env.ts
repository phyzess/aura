import type { Env } from "@/types/env";

/**
 * Create a test environment with all required bindings
 * This uses in-memory implementations for testing
 */
export function createTestEnv(db: D1Database, kv: KVNamespace): Env {
	return {
		DB: db,
		AUTH_KV: kv,
		BETTER_AUTH_SECRET: "test-secret-key-for-testing-only-min-32-chars",
		BETTER_AUTH_URL: "http://localhost:8787",
		BETTER_AUTH_TRUSTED_ORIGINS: "http://localhost:5173,chrome-extension://*",
		// Optional OAuth credentials (not needed for email/password tests)
		GOOGLE_CLIENT_ID: undefined,
		GOOGLE_CLIENT_SECRET: undefined,
		GITHUB_CLIENT_ID: undefined,
		GITHUB_CLIENT_SECRET: undefined,
		TURNSTILE_SECRET_KEY: undefined,
		// Optional alert configuration
		ALERT_EMAIL: undefined,
		EMAIL_DOMAIN: undefined,
		KV: undefined,
	};
}

/**
 * Generate a unique test email to avoid conflicts
 */
export function generateTestEmail(prefix = "test"): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(7);
	return `${prefix}-${timestamp}-${random}@test.com`;
}
