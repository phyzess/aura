/**
 * Test data helpers for creating workspaces, collections, and tabs
 */

export interface TestWorkspace {
	id: string;
	userId: string;
	name: string;
	description?: string;
	order: number;
	createdAt: number;
	updatedAt: number;
	deletedAt?: number;
}

export interface TestCollection {
	id: string;
	workspaceId: string;
	userId: string;
	name: string;
	description?: string;
	order: number;
	createdAt: number;
	updatedAt: number;
	deletedAt?: number;
}

export interface TestTab {
	id: string;
	collectionId: string;
	userId: string;
	url: string;
	title: string;
	faviconUrl?: string;
	isPinned: boolean;
	order: number;
	createdAt: number;
	updatedAt: number;
	deletedAt?: number;
}

/**
 * Create a test workspace in the database
 */
export async function createTestWorkspace(
	db: D1Database,
	userId: string,
	data: Partial<TestWorkspace> = {},
): Promise<TestWorkspace> {
	const now = Date.now();
	const workspace: TestWorkspace = {
		id: `ws-${Date.now()}-${Math.random().toString(36).substring(7)}`,
		userId,
		name: data.name || "Test Workspace",
		description: data.description,
		order: data.order ?? 0,
		createdAt: data.createdAt ?? now,
		updatedAt: data.updatedAt ?? now,
		deletedAt: data.deletedAt,
	};

	await db
		.prepare(
			`
      INSERT INTO workspaces (id, user_id, name, description, "order", created_at, updated_at, deleted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
		)
		.bind(
			workspace.id,
			workspace.userId,
			workspace.name,
			workspace.description || null,
			workspace.order,
			workspace.createdAt,
			workspace.updatedAt,
			workspace.deletedAt || null,
		)
		.run();

	return workspace;
}

/**
 * Create a test collection in the database
 */
export async function createTestCollection(
	db: D1Database,
	workspaceId: string,
	userId: string,
	data: Partial<TestCollection> = {},
): Promise<TestCollection> {
	const now = Date.now();
	const collection: TestCollection = {
		id: `col-${Date.now()}-${Math.random().toString(36).substring(7)}`,
		workspaceId,
		userId,
		name: data.name || "Test Collection",
		description: data.description,
		order: data.order ?? 0,
		createdAt: data.createdAt ?? now,
		updatedAt: data.updatedAt ?? now,
		deletedAt: data.deletedAt,
	};

	await db
		.prepare(
			`
      INSERT INTO collections (id, workspace_id, user_id, name, description, "order", created_at, updated_at, deleted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
		)
		.bind(
			collection.id,
			collection.workspaceId,
			collection.userId,
			collection.name,
			collection.description || null,
			collection.order,
			collection.createdAt,
			collection.updatedAt,
			collection.deletedAt || null,
		)
		.run();

	return collection;
}

/**
 * Create a test tab in the database
 */
export async function createTestTab(
	db: D1Database,
	collectionId: string,
	userId: string,
	data: Partial<TestTab> = {},
): Promise<TestTab> {
	const now = Date.now();
	const tab: TestTab = {
		id: `tab-${Date.now()}-${Math.random().toString(36).substring(7)}`,
		collectionId,
		userId,
		url: data.url || "https://example.com",
		title: data.title || "Test Tab",
		faviconUrl: data.faviconUrl,
		isPinned: data.isPinned ?? false,
		order: data.order ?? 0,
		createdAt: data.createdAt ?? now,
		updatedAt: data.updatedAt ?? now,
		deletedAt: data.deletedAt,
	};

	await db
		.prepare(
			`
      INSERT INTO tabs (id, collection_id, user_id, url, title, favicon_url, is_pinned, "order", created_at, updated_at, deleted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
		)
		.bind(
			tab.id,
			tab.collectionId,
			tab.userId,
			tab.url,
			tab.title,
			tab.faviconUrl || null,
			tab.isPinned ? 1 : 0,
			tab.order,
			tab.createdAt,
			tab.updatedAt,
			tab.deletedAt || null,
		)
		.run();

	return tab;
}

