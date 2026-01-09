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

export const handleGetMe = async (c: Context<{ Bindings: Env }>) => {
	const auth = createAuth(c.env, c.req.raw.cf);

	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session?.user) {
		return c.json({ user: null });
	}

	const user = buildUserResponse(session.user);

	return c.json<{ user: DomainUser | null }>({ user });
};
