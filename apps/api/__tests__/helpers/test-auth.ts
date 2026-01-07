import type { User } from "@aura/domain";
import type { Context } from "hono";
import { createAuth } from "@/auth";
import type { Env } from "@/types/env";

export interface TestUserResult {
	user: User;
	sessionToken: string;
}

/**
 * Create a test user with email/password
 * Uses Better Auth's signUpEmail and signInEmail APIs
 */
export async function createTestUser(
	env: Env,
	email: string,
	password: string,
	name = "Test User",
): Promise<TestUserResult> {
	const auth = createAuth(env, undefined);

	// Create request for signup
	const signUpRequest = new Request("http://localhost/api/auth/sign-up/email", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			email,
			password,
			name,
		}),
	});

	const signUpResponse = await auth.handler(signUpRequest);
	const signUpData = (await signUpResponse.json()) as {
		user?: User;
		session?: { token: string };
	};

	if (!signUpData?.user) {
		throw new Error(
			`Failed to create test user: ${JSON.stringify(signUpData)}`,
		);
	}

	// Extract session token from signup response
	// Better Auth returns session in the signup response
	let sessionToken = signUpData.session?.token;

	// If no session token in signup, try sign-in
	if (!sessionToken) {
		const signInRequest = new Request(
			"http://localhost/api/auth/sign-in/email",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email,
					password,
				}),
			},
		);

		const signInResponse = await auth.handler(signInRequest);
		const signInData = (await signInResponse.json()) as {
			token?: string;
			session?: { token: string };
		};

		sessionToken = signInData.token || signInData.session?.token;

		if (!sessionToken) {
			throw new Error(
				`Failed to get session token: ${JSON.stringify(signInData)}`,
			);
		}
	}

	console.log("[test-auth] Created user with session token:", sessionToken);

	return {
		user: signUpData.user,
		sessionToken,
	};
}

/**
 * Create authenticated request headers
 * Better Auth primarily uses cookies for session management
 */
export function createAuthHeaders(sessionToken: string): Headers {
	const headers = new Headers();
	// Better Auth uses cookie-based sessions
	headers.set("Cookie", `better-auth.session_token=${sessionToken}`);
	headers.set("Content-Type", "application/json");
	return headers;
}

/**
 * Create a mock Hono context for testing handlers
 * This creates a minimal context that works with Better Auth
 */
export function createMockContext(env: Env, request: Request): Context {
	// Clone the request to avoid body consumption issues
	const clonedRequest = request.clone();

	return {
		env,
		req: {
			raw: clonedRequest,
			json: async () => {
				const text = await clonedRequest.clone().text();
				return text ? JSON.parse(text) : {};
			},
			header: (name: string) => clonedRequest.headers.get(name),
		},
		json: (data: unknown, status = 200) => {
			return new Response(JSON.stringify(data), {
				status,
				headers: { "Content-Type": "application/json" },
			});
		},
		text: (text: string, status = 200) => {
			return new Response(text, { status });
		},
		get: (_key: string) => {
			// Mock context.get for storing values
			return undefined;
		},
		set: (_key: string, _value: unknown) => {
			// Mock context.set for storing values
		},
	} as unknown as Context;
}

/**
 * Create a mock authenticated user for testing
 * This bypasses Better Auth and directly creates user in DB
 */
export async function createMockUser(
	db: D1Database,
	email: string,
	name = "Test User",
): Promise<User> {
	const userId = `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
	const now = Date.now();

	// Insert user directly into database
	await db
		.prepare(
			`
    INSERT INTO users (id, name, email, email_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
		)
		.bind(userId, name, email, 0, now, now)
		.run();

	return {
		id: userId,
		email,
		name,
		createdAt: now,
		updatedAt: now,
	};
}
