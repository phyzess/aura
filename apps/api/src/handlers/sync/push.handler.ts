import {
	type Collection,
	type TabItem,
	validateCollections,
	validateRelationships,
	validateTabs,
	validateWorkspaces,
	type Workspace,
} from "@aura/domain";
import type { Context } from "hono";
import { createAuth } from "@/auth";
import { createCollectionData } from "@/data/collection.data";
import { createTabData } from "@/data/tab.data";
import { createWorkspaceData } from "@/data/workspace.data";
import { createDb } from "@/db";
import type { Env } from "@/types/env";

export const handlePush = async (c: Context<{ Bindings: Env }>) => {
	try {
		const auth = createAuth(c.env, c.req.raw.cf);

		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session?.user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const payload = (await c.req.json().catch(() => null)) as {
			workspaces?: unknown;
			collections?: unknown;
			tabs?: unknown;
			lastSyncTimestamp?: unknown;
		} | null;

		if (!payload || typeof payload !== "object") {
			return c.json({ error: "Invalid payload" }, 400);
		}

		const workspacesArray = Array.isArray(payload.workspaces)
			? payload.workspaces
			: [];
		const collectionsArray = Array.isArray(payload.collections)
			? payload.collections
			: [];
		const tabsArray = Array.isArray(payload.tabs) ? payload.tabs : [];

		const workspaces = validateWorkspaces(workspacesArray);
		const collections = validateCollections(collectionsArray);
		const tabs = validateTabs(tabsArray);

		const relationshipsResult = validateRelationships(
			workspaces,
			collections,
			tabs,
		);
		if (!relationshipsResult.valid) {
			return c.json({ error: relationshipsResult.errors.join(", ") }, 400);
		}

		const userId = session.user.id;
		const db = createDb(c.env.DB);

		const workspaceData = createWorkspaceData(db);
		const collectionData = createCollectionData(db);
		const tabData = createTabData(db);

		const workspacesWithUser = workspaces.map((w: Workspace) => ({
			...w,
			userId,
		}));
		const collectionsWithUser = collections.map((c: Collection) => ({
			...c,
			userId,
		}));
		const tabsWithUser = tabs.map((t: TabItem) => ({ ...t, userId }));

		console.log("[sync/push] request summary", {
			userId,
			workspacesCount: workspaces.length,
			collectionsCount: collections.length,
			tabsCount: tabs.length,
		});

		await Promise.all([
			workspaceData.batchUpsert(workspacesWithUser),
			collectionData.batchUpsert(collectionsWithUser),
			tabData.batchUpsert(tabsWithUser),
		]);

		return c.json({ success: true });
	} catch (error) {
		console.error("[sync/push] error", error);
		return c.json({ error: "Internal server error" }, 500);
	}
};
