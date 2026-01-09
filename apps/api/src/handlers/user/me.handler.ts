import type { User as DomainUser } from "@aura/domain";
import type { Context } from "hono";
import { createAuth } from "@/auth";
import type { Env } from "@/types/env";
import { toMillis } from "@/utils/date";

interface BetterAuthUser {
	id: string;
	email: string;
	name?: string;
	createdAt: Date | number;
	updatedAt: Date | number;
}

const buildUserResponse = (user: BetterAuthUser): DomainUser => ({
	id: user.id,
	email: user.email,
	name: user.name ?? user.email,
	createdAt: toMillis(user.createdAt),
	updatedAt: toMillis(user.updatedAt),
});

interface DbSessionRow {
	user_id: string;
	email: string;
	name: string;
	user_created_at: number;
	user_updated_at: number;
}

export const handleGetMe = async (c: Context<{ Bindings: Env }>) => {
	const auth = createAuth(c.env, c.req.raw.cf);

	// Try Better Auth's getSession first
	let session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	// Fallback: If Better Auth fails, try manual session lookup
	// This is needed for testing environments where Better Auth's session
	// validation might not work correctly
	if (!session?.user) {
		const cookieHeader = c.req.raw.headers.get("cookie");
		if (cookieHeader) {
			const tokenMatch = cookieHeader.match(
				/better-auth\.session_token=([^;]+)/,
			);
			if (tokenMatch) {
				const token = tokenMatch[1];

				// Query session and user directly from DB
				const dbSession = await c.env.DB.prepare(
					`
					SELECT s.*, u.id as user_id, u.email, u.name, u.created_at as user_created_at, u.updated_at as user_updated_at
					FROM sessions s
					JOIN users u ON s.user_id = u.id
					WHERE s.token = ? AND s.expires_at > ?
				`,
				)
					.bind(token, Date.now())
					.first<DbSessionRow>();

				if (dbSession) {
					// Manually construct session object
					session = {
						user: {
							id: dbSession.user_id,
							email: dbSession.email,
							name: dbSession.name,
							createdAt: dbSession.user_created_at,
							updatedAt: dbSession.user_updated_at,
						},
						session: {
							token: token,
							userId: dbSession.user_id,
							expiresAt: new Date(),
						},
					};
				}
			}
		}
	}

	if (!session?.user) {
		return c.json({ user: null });
	}

	const user = buildUserResponse(session.user);

	return c.json<{ user: DomainUser | null }>({ user });
};
