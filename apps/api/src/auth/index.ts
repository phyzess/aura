import type {
	D1Database,
	IncomingRequestCfProperties,
} from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { withCloudflare } from "better-auth-cloudflare";
import { createDb, schema } from "../db";
import type { Env } from "../index";
import { getAuthConfig } from "./config";

export function createAuth(env?: Env, cf?: IncomingRequestCfProperties) {
	const db = env ? createDb(env.DB) : ({} as unknown);

	const baseConfig = withCloudflare(
		{
			autoDetectIpAddress: true,
			geolocationTracking: true,
			cf: cf || {},
			d1: env
				? {
						db,
						options: {
							usePlural: true,
							debugLogs: true,
						},
					}
				: undefined,
		},
		{
			emailAndPassword: {
				enabled: true,
			},
		},
	);

	let secret: string | undefined;
	let baseURL: string | undefined;
	let trustedOrigins: string[] = [];

	if (env) {
		const appConfig = getAuthConfig(env);
		secret = appConfig.auth.secret;
		baseURL = appConfig.auth.baseURL;
		trustedOrigins = appConfig.auth.trustedOrigins;
	}

	if (!secret) {
		console.error("[auth][config] Missing BETTER_AUTH_SECRET in env");
	} else {
		console.log("[auth][config] Using secret with length", secret.length);
	}

	if (!trustedOrigins.length) {
		console.error(
			"[auth][config] BETTER_AUTH_TRUSTED_ORIGINS is empty; no explicit origins configured.",
		);
	} else {
		console.log("[auth][config] trustedOrigins:", trustedOrigins.join(","));
	}

	return betterAuth({
		...baseConfig,
		...(trustedOrigins.length ? { trustedOrigins } : {}),
		// Explicitly provide secret & baseURL so Better Auth/Auth.js don't complain
		...(secret ? { secret } : {}),
		...(baseURL ? { baseURL } : {}),
		...(env
			? {}
			: {
					database: drizzleAdapter({} as D1Database, {
						provider: "sqlite",
						usePlural: true,
						debugLogs: true,
						schema,
					}),
				}),
	});
}
