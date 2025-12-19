import type { AppConfig } from "@aura/config";
import { buildWorkerConfig } from "@aura/config";
import type { Env } from "../index";

export function getAuthConfig(env: Env): AppConfig {
	return buildWorkerConfig({
		BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
		BETTER_AUTH_URL: env.BETTER_AUTH_URL,
		BETTER_AUTH_TRUSTED_ORIGINS: env.BETTER_AUTH_TRUSTED_ORIGINS,
	});
}
