import type {
	AnalyticsEngineDataset,
	D1Database,
	KVNamespace,
} from "@cloudflare/workers-types";

export interface Env {
	DB: D1Database;
	AUTH_KV: KVNamespace;
	KV: KVNamespace;
	ANALYTICS: AnalyticsEngineDataset;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	BETTER_AUTH_TRUSTED_ORIGINS: string;
	TURNSTILE_SECRET_KEY?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	GITHUB_CLIENT_ID?: string;
	GITHUB_CLIENT_SECRET?: string;
	EMAIL_DOMAIN?: string;
	ALERT_EMAIL?: string;
	RESEND_API_KEY?: string;
}
