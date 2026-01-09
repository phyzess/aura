import {
	type InferOutput,
	minLength,
	object,
	optional,
	parse,
	pipe,
	string,
	transform,
} from "valibot";

// Export constants
export * from "./constants";
export * from "./errors";

const trustedOriginsSchema = pipe(
	string("BETTER_AUTH_TRUSTED_ORIGINS is required"),
	minLength(1, "BETTER_AUTH_TRUSTED_ORIGINS is required"),
	transform((raw) =>
		raw
			.split(",")
			.map((origin) => origin.trim())
			.filter(Boolean),
	),
);

export const workerEnvSchema = object({
	BETTER_AUTH_SECRET: pipe(
		string(),
		minLength(1, "BETTER_AUTH_SECRET is required"),
	),
	BETTER_AUTH_URL: pipe(string(), minLength(1, "BETTER_AUTH_URL is required")),
	BETTER_AUTH_TRUSTED_ORIGINS: trustedOriginsSchema,
	TURNSTILE_SECRET_KEY: optional(string()),
	GOOGLE_CLIENT_ID: optional(string()),
	GOOGLE_CLIENT_SECRET: optional(string()),
	GITHUB_CLIENT_ID: optional(string()),
	GITHUB_CLIENT_SECRET: optional(string()),
});

export type WorkerEnv = InferOutput<typeof workerEnvSchema>;

export interface OAuthConfig {
	google?: {
		clientId: string;
		clientSecret: string;
	};
	github?: {
		clientId: string;
		clientSecret: string;
	};
}

export interface AuthConfig {
	secret: string;
	baseURL: string;
	trustedOrigins: string[];
	turnstileSecretKey?: string;
	oauth: OAuthConfig;
}

export interface AppConfig {
	auth: AuthConfig;
}

export function buildWorkerConfig(env: {
	BETTER_AUTH_SECRET?: unknown;
	BETTER_AUTH_URL?: unknown;
	BETTER_AUTH_TRUSTED_ORIGINS?: unknown;
	TURNSTILE_SECRET_KEY?: unknown;
	GOOGLE_CLIENT_ID?: unknown;
	GOOGLE_CLIENT_SECRET?: unknown;
	GITHUB_CLIENT_ID?: unknown;
	GITHUB_CLIENT_SECRET?: unknown;
}): AppConfig {
	const parsed = parse(workerEnvSchema, env);

	const oauth: OAuthConfig = {};
	if (parsed.GOOGLE_CLIENT_ID && parsed.GOOGLE_CLIENT_SECRET) {
		oauth.google = {
			clientId: parsed.GOOGLE_CLIENT_ID,
			clientSecret: parsed.GOOGLE_CLIENT_SECRET,
		};
	}
	if (parsed.GITHUB_CLIENT_ID && parsed.GITHUB_CLIENT_SECRET) {
		oauth.github = {
			clientId: parsed.GITHUB_CLIENT_ID,
			clientSecret: parsed.GITHUB_CLIENT_SECRET,
		};
	}

	return {
		auth: {
			secret: parsed.BETTER_AUTH_SECRET,
			baseURL: parsed.BETTER_AUTH_URL,
			trustedOrigins: parsed.BETTER_AUTH_TRUSTED_ORIGINS,
			turnstileSecretKey: parsed.TURNSTILE_SECRET_KEY,
			oauth,
		},
	};
}

const extensionEnvSchema = object({
	VITE_API_BASE_URL: pipe(
		string(),
		minLength(1, "VITE_API_BASE_URL is required"),
	),
});

export type ExtensionEnv = InferOutput<typeof extensionEnvSchema>;

export interface ClientConfig {
	apiBaseUrl: string;
}

export function buildClientConfigFromViteEnv(
	env: Record<string, unknown>,
): ClientConfig {
	const parsed = parse(extensionEnvSchema, env);
	return {
		apiBaseUrl: parsed.VITE_API_BASE_URL,
	};
}

export function validateExtensionEnvForNode(
	env: Record<string, string | undefined>,
): void {
	parse(extensionEnvSchema, env);
}
