import { describe, expect, it } from "vitest";
import {
	buildClientConfigFromViteEnv,
	buildWorkerConfig,
	validateExtensionEnvForNode,
} from "../src/index";

describe("Config", () => {
	describe("buildWorkerConfig", () => {
		it("should build config with all required fields", () => {
			const env = {
				BETTER_AUTH_SECRET: "test-secret-key",
				BETTER_AUTH_URL: "https://api.example.com",
				BETTER_AUTH_TRUSTED_ORIGINS:
					"https://example.com,https://app.example.com",
			};

			const config = buildWorkerConfig(env);

			expect(config.auth.secret).toBe("test-secret-key");
			expect(config.auth.baseURL).toBe("https://api.example.com");
			expect(config.auth.trustedOrigins).toEqual([
				"https://example.com",
				"https://app.example.com",
			]);
			expect(config.auth.oauth).toEqual({});
		});

		it("should parse trusted origins with whitespace", () => {
			const env = {
				BETTER_AUTH_SECRET: "secret",
				BETTER_AUTH_URL: "https://api.example.com",
				BETTER_AUTH_TRUSTED_ORIGINS:
					"  https://example.com  ,  https://app.example.com  ",
			};

			const config = buildWorkerConfig(env);

			expect(config.auth.trustedOrigins).toEqual([
				"https://example.com",
				"https://app.example.com",
			]);
		});

		it("should include Google OAuth when credentials provided", () => {
			const env = {
				BETTER_AUTH_SECRET: "secret",
				BETTER_AUTH_URL: "https://api.example.com",
				BETTER_AUTH_TRUSTED_ORIGINS: "https://example.com",
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
			};

			const config = buildWorkerConfig(env);

			expect(config.auth.oauth.google).toEqual({
				clientId: "google-client-id",
				clientSecret: "google-client-secret",
			});
		});

		it("should include GitHub OAuth when credentials provided", () => {
			const env = {
				BETTER_AUTH_SECRET: "secret",
				BETTER_AUTH_URL: "https://api.example.com",
				BETTER_AUTH_TRUSTED_ORIGINS: "https://example.com",
				GITHUB_CLIENT_ID: "github-client-id",
				GITHUB_CLIENT_SECRET: "github-client-secret",
			};

			const config = buildWorkerConfig(env);

			expect(config.auth.oauth.github).toEqual({
				clientId: "github-client-id",
				clientSecret: "github-client-secret",
			});
		});

		it("should include both OAuth providers when all credentials provided", () => {
			const env = {
				BETTER_AUTH_SECRET: "secret",
				BETTER_AUTH_URL: "https://api.example.com",
				BETTER_AUTH_TRUSTED_ORIGINS: "https://example.com",
				GOOGLE_CLIENT_ID: "google-id",
				GOOGLE_CLIENT_SECRET: "google-secret",
				GITHUB_CLIENT_ID: "github-id",
				GITHUB_CLIENT_SECRET: "github-secret",
			};

			const config = buildWorkerConfig(env);

			expect(config.auth.oauth.google).toBeDefined();
			expect(config.auth.oauth.github).toBeDefined();
		});

		it("should not include OAuth provider when only client ID provided", () => {
			const env = {
				BETTER_AUTH_SECRET: "secret",
				BETTER_AUTH_URL: "https://api.example.com",
				BETTER_AUTH_TRUSTED_ORIGINS: "https://example.com",
				GOOGLE_CLIENT_ID: "google-id",
			};

			const config = buildWorkerConfig(env);

			expect(config.auth.oauth.google).toBeUndefined();
		});

		it("should include turnstile secret key when provided", () => {
			const env = {
				BETTER_AUTH_SECRET: "secret",
				BETTER_AUTH_URL: "https://api.example.com",
				BETTER_AUTH_TRUSTED_ORIGINS: "https://example.com",
				TURNSTILE_SECRET_KEY: "turnstile-key",
			};

			const config = buildWorkerConfig(env);

			expect(config.auth.turnstileSecretKey).toBe("turnstile-key");
		});

		it("should throw error when BETTER_AUTH_SECRET is missing", () => {
			const env = {
				BETTER_AUTH_URL: "https://api.example.com",
				BETTER_AUTH_TRUSTED_ORIGINS: "https://example.com",
			};

			expect(() => buildWorkerConfig(env)).toThrow();
		});

		it("should throw error when BETTER_AUTH_URL is missing", () => {
			const env = {
				BETTER_AUTH_SECRET: "secret",
				BETTER_AUTH_TRUSTED_ORIGINS: "https://example.com",
			};

			expect(() => buildWorkerConfig(env)).toThrow();
		});

		it("should throw error when BETTER_AUTH_TRUSTED_ORIGINS is missing", () => {
			const env = {
				BETTER_AUTH_SECRET: "secret",
				BETTER_AUTH_URL: "https://api.example.com",
			};

			expect(() => buildWorkerConfig(env)).toThrow();
		});

		it("should throw error when BETTER_AUTH_SECRET is empty string", () => {
			const env = {
				BETTER_AUTH_SECRET: "",
				BETTER_AUTH_URL: "https://api.example.com",
				BETTER_AUTH_TRUSTED_ORIGINS: "https://example.com",
			};

			expect(() => buildWorkerConfig(env)).toThrow();
		});
	});

	describe("buildClientConfigFromViteEnv", () => {
		it("should build client config with API base URL", () => {
			const env = {
				VITE_API_BASE_URL: "https://api.example.com",
			};

			const config = buildClientConfigFromViteEnv(env);

			expect(config.apiBaseUrl).toBe("https://api.example.com");
		});

		it("should throw error when VITE_API_BASE_URL is missing", () => {
			const env = {};

			expect(() => buildClientConfigFromViteEnv(env)).toThrow();
		});

		it("should throw error when VITE_API_BASE_URL is empty string", () => {
			const env = {
				VITE_API_BASE_URL: "",
			};

			expect(() => buildClientConfigFromViteEnv(env)).toThrow();
		});

		it("should handle extra properties in env", () => {
			const env = {
				VITE_API_BASE_URL: "https://api.example.com",
				VITE_OTHER_VAR: "other-value",
				NODE_ENV: "production",
			};

			const config = buildClientConfigFromViteEnv(env);

			expect(config.apiBaseUrl).toBe("https://api.example.com");
		});
	});

	describe("validateExtensionEnvForNode", () => {
		it("should validate correct environment", () => {
			const env = {
				VITE_API_BASE_URL: "https://api.example.com",
			};

			expect(() => validateExtensionEnvForNode(env)).not.toThrow();
		});

		it("should throw error when VITE_API_BASE_URL is missing", () => {
			const env = {};

			expect(() => validateExtensionEnvForNode(env)).toThrow();
		});

		it("should throw error when VITE_API_BASE_URL is undefined", () => {
			const env = {
				VITE_API_BASE_URL: undefined,
			};

			expect(() => validateExtensionEnvForNode(env)).toThrow();
		});

		it("should throw error when VITE_API_BASE_URL is empty string", () => {
			const env = {
				VITE_API_BASE_URL: "",
			};

			expect(() => validateExtensionEnvForNode(env)).toThrow();
		});
	});
});
