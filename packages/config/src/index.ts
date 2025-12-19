import {
	type InferOutput,
	minLength,
	object,
	parse,
	pipe,
	string,
	transform,
} from "valibot";

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
});

export type WorkerEnv = InferOutput<typeof workerEnvSchema>;

export interface AuthConfig {
	secret: string;
	baseURL: string;
	trustedOrigins: string[];
}

export interface AppConfig {
	auth: AuthConfig;
}

export function buildWorkerConfig(env: {
	BETTER_AUTH_SECRET?: unknown;
	BETTER_AUTH_URL?: unknown;
	BETTER_AUTH_TRUSTED_ORIGINS?: unknown;
}): AppConfig {
	const parsed = parse(workerEnvSchema, env);
	return {
		auth: {
			secret: parsed.BETTER_AUTH_SECRET,
			baseURL: parsed.BETTER_AUTH_URL,
			trustedOrigins: parsed.BETTER_AUTH_TRUSTED_ORIGINS,
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
