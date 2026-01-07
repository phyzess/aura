import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getPlatformProxy } from "wrangler";
import { handleGetMe } from "@/handlers/user/me.handler";
import type { Env } from "@/types/env";
import {
	createAuthHeaders,
	createMockContext,
	createTestUser,
} from "../../helpers/test-auth";
import { cleanupTestDb, initTestDb } from "../../helpers/test-db";
import { createTestEnv, generateTestEmail } from "../../helpers/test-env";

/**
 * Integration tests for GET /me endpoint
 *
 * Tests the user profile retrieval functionality with real database and auth
 */
describe("GET /me Handler", () => {
	let env: Env;
	let cleanup: () => Promise<void>;

	beforeEach(async () => {
		// Get Cloudflare bindings (D1, KV) for testing
		const proxy = await getPlatformProxy();
		const db = proxy.env.DB as D1Database;
		const kv = proxy.env.AUTH_KV as KVNamespace;

		// Initialize database schema
		await initTestDb(db);

		// Create test environment
		env = createTestEnv(db, kv);
		cleanup = proxy.dispose;
	});

	afterEach(async () => {
		if (env?.DB) {
			await cleanupTestDb(env.DB);
		}
		if (cleanup) {
			await cleanup();
		}
	});

	it("should return user info for authenticated request", async () => {
		// Arrange: Create test user
		const testEmail = generateTestEmail("me-test");
		const { user, sessionToken } = await createTestUser(
			env,
			testEmail,
			"password123",
			"Test User",
		);

		// Act: Call /me endpoint
		const headers = createAuthHeaders(sessionToken);
		console.log("[TEST] Request headers:", {
			authorization: headers.get("Authorization"),
			cookie: headers.get("Cookie"),
		});

		const request = new Request("http://localhost/me", {
			method: "GET",
			headers,
		});

		const context = createMockContext(env, request);
		const response = await handleGetMe(context);

		// Assert: Should return user data
		expect(response.status).toBe(200);

		const data = (await response.json()) as {
			user: { email: string; id: string; name: string } | null;
		};
		console.log("[TEST] Response data:", JSON.stringify(data, null, 2));
		expect(data.user).toBeDefined();
		expect(data.user?.email).toBe(testEmail);
		expect(data.user?.id).toBe(user.id);
		expect(data.user?.name).toBe("Test User");
	});

	it("should return null user for unauthenticated request", async () => {
		// Act: Call /me without authentication
		const request = new Request("http://localhost/me", {
			method: "GET",
		});

		const context = createMockContext(env, request);
		const response = await handleGetMe(context);

		// Assert: Should return null user (not 401)
		expect(response.status).toBe(200);

		const data = (await response.json()) as { user: null };
		expect(data.user).toBeNull();
	});

	it("should return null user for invalid token", async () => {
		// Act: Call /me with invalid token
		const request = new Request("http://localhost/me", {
			method: "GET",
			headers: createAuthHeaders("invalid-token-12345"),
		});

		const context = createMockContext(env, request);
		const response = await handleGetMe(context);

		// Assert: Should return null user
		expect(response.status).toBe(200);

		const data = (await response.json()) as { user: null };
		expect(data.user).toBeNull();
	});

	it("should include user timestamps", async () => {
		// Arrange
		const testEmail = generateTestEmail("timestamps-test");
		const { sessionToken } = await createTestUser(
			env,
			testEmail,
			"password123",
		);

		// Act
		const request = new Request("http://localhost/me", {
			method: "GET",
			headers: createAuthHeaders(sessionToken),
		});

		const context = createMockContext(env, request);
		const response = await handleGetMe(context);

		// Assert: Should include timestamps
		const data = (await response.json()) as {
			user: { createdAt: number; updatedAt: number } | null;
		};
		expect(data.user?.createdAt).toBeGreaterThan(0);
		expect(data.user?.updatedAt).toBeGreaterThan(0);
		expect(data.user?.createdAt).toBeLessThanOrEqual(Date.now());
	});
});
