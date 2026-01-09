import type { D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { withCloudflare } from "better-auth-cloudflare";
import { authLogger } from "@/logger";
import { createDb, schema } from "../db";
import type { Env } from "../index";
import { getAuthConfig } from "./config";
import { hashPassword, verifyPassword } from "./password";

export function createAuth(env?: Env, cf?: unknown) {
	const db = env ? createDb(env.DB) : ({} as any);

	let secret: string | undefined;
	let baseURL: string | undefined;
	let trustedOrigins: string[] = [];
	let appConfig: ReturnType<typeof getAuthConfig> | undefined;

	if (env) {
		appConfig = getAuthConfig(env);
		secret = appConfig.auth.secret;
		baseURL = appConfig.auth.baseURL;
		trustedOrigins = appConfig.auth.trustedOrigins;
	}

	const socialProviders: Record<
		string,
		{ clientId: string; clientSecret: string }
	> = {};

	if (appConfig?.auth.oauth.google) {
		socialProviders.google = {
			clientId: appConfig.auth.oauth.google.clientId,
			clientSecret: appConfig.auth.oauth.google.clientSecret,
		};
	}

	if (appConfig?.auth.oauth.github) {
		socialProviders.github = {
			clientId: appConfig.auth.oauth.github.clientId,
			clientSecret: appConfig.auth.oauth.github.clientSecret,
		};
	}

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
				password: {
					hash: hashPassword,
					verify: verifyPassword,
				},
			},
			socialProviders:
				Object.keys(socialProviders).length > 0 ? socialProviders : undefined,
		},
	);

	if (!secret) {
		authLogger.error("Missing BETTER_AUTH_SECRET in env");
	} else {
		authLogger.info("Using secret", { length: secret.length });
	}

	if (!trustedOrigins.length) {
		authLogger.error(
			"BETTER_AUTH_TRUSTED_ORIGINS is empty; no explicit origins configured",
		);
	} else {
		authLogger.info("Trusted origins configured", {
			origins: trustedOrigins.join(","),
		});
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
