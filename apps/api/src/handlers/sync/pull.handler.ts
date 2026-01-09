import { COMMON_ERROR_RESPONSES, HTTP_STATUS } from "@aura/config";
import type { Collection, SyncPayload, TabItem, Workspace } from "@aura/domain";
import type { Context } from "hono";
import { createAuth } from "@/auth";
import { createCollectionData } from "@/data/collection.data";
import { createTabData } from "@/data/tab.data";
import { createWorkspaceData } from "@/data/workspace.data";
import { createDb } from "@/db";
import type { Env } from "@/types/env";

const buildSyncResponse = (
	workspaces: Workspace[],
	collections: Collection[],
	tabs: TabItem[],
): SyncPayload => ({
	workspaces,
	collections,
	tabs,
	lastSyncTimestamp: Date.now(),
});

export const handlePull = async (c: Context<{ Bindings: Env }>) => {
	const auth = createAuth(c.env, c.req.raw.cf);

	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session?.user) {
		return c.json(
			COMMON_ERROR_RESPONSES.unauthorized(),
			HTTP_STATUS.UNAUTHORIZED,
		);
	}

	const body = (await c.req.json().catch(() => null)) as {
		lastSyncTimestamp?: unknown;
	} | null;

	const lastSyncRaw =
		body && typeof body === "object" ? body.lastSyncTimestamp : undefined;

	const lastSyncTimestamp =
		typeof lastSyncRaw === "number" && Number.isFinite(lastSyncRaw)
			? lastSyncRaw
			: 0;

	const userId = session.user.id;
	const db = createDb(c.env.DB);

	const workspaceData = createWorkspaceData(db);
	const collectionData = createCollectionData(db);
	const tabData = createTabData(db);

	const [workspacesResult, collections, tabs] = await Promise.all([
		workspaceData.findByUserId(userId, lastSyncTimestamp),
		collectionData.findByUserId(userId, lastSyncTimestamp),
		tabData.findByUserId(userId, lastSyncTimestamp),
	]);

	if (!workspacesResult.ok) {
		return c.json(
			COMMON_ERROR_RESPONSES.internalError(),
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
		);
	}

	const workspaces = workspacesResult.value;

	const response = buildSyncResponse(workspaces, collections, tabs);

	console.log("[sync/pull] response summary", {
		userId,
		workspacesCount: workspaces.length,
		collectionsCount: collections.length,
		tabsCount: tabs.length,
		lastSyncTimestamp: response.lastSyncTimestamp,
	});

	return c.json(response);
};
