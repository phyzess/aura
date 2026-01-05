import type { AppConfig } from "@aura/config";
import { buildWorkerConfig } from "@aura/config";
import type { Env } from "../index";

export function getAuthConfig(env: Env): AppConfig {
	return buildWorkerConfig({
		BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
		BETTER_AUTH_URL: env.BETTER_AUTH_URL,
		BETTER_AUTH_TRUSTED_ORIGINS: env.BETTER_AUTH_TRUSTED_ORIGINS,
		TURNSTILE_SECRET_KEY: env.TURNSTILE_SECRET_KEY,
		GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
		GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
		GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
	});
}
