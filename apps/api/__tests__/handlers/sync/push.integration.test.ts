import type { Collection, TabItem, Workspace } from "@aura/domain";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getPlatformProxy } from "wrangler";
import { createCollectionData } from "@/data/collection.data";
import { createTabData } from "@/data/tab.data";
import { createWorkspaceData } from "@/data/workspace.data";
import { createDb } from "@/db";
import type { Env } from "@/types/env";
import { createMockUser } from "../../helpers/test-auth";
import {
	createTestCollection,
	createTestTab,
	createTestWorkspace,
} from "../../helpers/test-data";
import { cleanupTestDb, initTestDb } from "../../helpers/test-db";
import { createTestEnv, generateTestEmail } from "../../helpers/test-env";

/**
 * Integration tests for sync/push data layer
 * Tests the data upsert operations (create and update)
 */
describe("Sync Push Data Layer Integration", () => {
	let env: Env;
	let cleanup: () => Promise<void>;
	let db: D1Database;

	beforeEach(async () => {
		const proxy = await getPlatformProxy();
		db = proxy.env.DB as D1Database;
		const kv = proxy.env.AUTH_KV as KVNamespace;

		await initTestDb(db);

		env = createTestEnv(db, kv);
		cleanup = proxy.dispose;
	});

	afterEach(async () => {
		if (db) {
			await cleanupTestDb(db);
		}
		if (cleanup) {
			await cleanup();
		}
	});

	describe("Workspace Operations", () => {
		it("should create new workspaces", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("push-workspace-create"),
				"Test User",
			);

			const drizzleDb = createDb(db);
			const workspaceData = createWorkspaceData(drizzleDb);

			const newWorkspace: Workspace = {
				id: crypto.randomUUID(),
				userId: user.id,
				name: "New Workspace",
				order: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			await workspaceData.batchUpsert([newWorkspace]);

			const workspaces = await workspaceData.findByUserId(user.id, 0);

			expect(workspaces).toHaveLength(1);
			expect(workspaces[0].id).toBe(newWorkspace.id);
			expect(workspaces[0].name).toBe("New Workspace");
		});

		it("should update existing workspaces", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("push-workspace-update"),
				"Test User",
			);

			const workspace = await createTestWorkspace(db, user.id, {
				name: "Original Name",
			});

			const drizzleDb = createDb(db);
			const workspaceData = createWorkspaceData(drizzleDb);

			const updatedWorkspace: Workspace = {
				...workspace,
				name: "Updated Name",
				updatedAt: Date.now(),
			};

			await workspaceData.batchUpsert([updatedWorkspace]);

			const workspaces = await workspaceData.findByUserId(user.id, 0);

			expect(workspaces).toHaveLength(1);
			expect(workspaces[0].id).toBe(workspace.id);
			expect(workspaces[0].name).toBe("Updated Name");
		});

		it("should soft delete workspaces", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("push-workspace-delete"),
				"Test User",
			);

			const workspace = await createTestWorkspace(db, user.id, {
				name: "To Delete",
			});

			const drizzleDb = createDb(db);
			const workspaceData = createWorkspaceData(drizzleDb);

			const deletedWorkspace: Workspace = {
				...workspace,
				deletedAt: Date.now(),
				updatedAt: Date.now(),
			};

			await workspaceData.batchUpsert([deletedWorkspace]);

			const workspaces = await workspaceData.findByUserId(user.id, 0);

			expect(workspaces).toHaveLength(1);
			expect(workspaces[0].deletedAt).toBeDefined();
			expect(workspaces[0].deletedAt).toBeGreaterThan(0);
		});

		it("should batch upsert multiple workspaces", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("push-workspace-batch"),
				"Test User",
			);

			const drizzleDb = createDb(db);
			const workspaceData = createWorkspaceData(drizzleDb);

			const workspaces: Workspace[] = Array.from({ length: 5 }, (_, i) => ({
				id: crypto.randomUUID(),
				userId: user.id,
				name: `Workspace ${i + 1}`,
				order: i,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			}));

			await workspaceData.batchUpsert(workspaces);

			const result = await workspaceData.findByUserId(user.id, 0);

			expect(result).toHaveLength(5);
		});
	});

	describe("Collection Operations", () => {
		it("should create new collections", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("push-collection-create"),
				"Test User",
			);

			const workspace = await createTestWorkspace(db, user.id, {
				name: "Test Workspace",
			});

			const drizzleDb = createDb(db);
			const collectionData = createCollectionData(drizzleDb);

			const newCollection: Collection = {
				id: crypto.randomUUID(),
				workspaceId: workspace.id,
				userId: user.id,
				name: "New Collection",
				order: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			await collectionData.batchUpsert([newCollection]);

			const collections = await collectionData.findByUserId(user.id, 0);

			expect(collections).toHaveLength(1);
			expect(collections[0].id).toBe(newCollection.id);
			expect(collections[0].name).toBe("New Collection");
			expect(collections[0].workspaceId).toBe(workspace.id);
		});

		it("should update existing collections", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("push-collection-update"),
				"Test User",
			);

			const workspace = await createTestWorkspace(db, user.id, {
				name: "Test Workspace",
			});

			const collection = await createTestCollection(db, workspace.id, user.id, {
				name: "Original Name",
			});

			const drizzleDb = createDb(db);
			const collectionData = createCollectionData(drizzleDb);

			const updatedCollection: Collection = {
				...collection,
				name: "Updated Name",
				updatedAt: Date.now(),
			};

			await collectionData.batchUpsert([updatedCollection]);

			const collections = await collectionData.findByUserId(user.id, 0);

			expect(collections).toHaveLength(1);
			expect(collections[0].name).toBe("Updated Name");
		});

		it("should soft delete collections", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("push-collection-delete"),
				"Test User",
			);

			const workspace = await createTestWorkspace(db, user.id, {
				name: "Test Workspace",
			});

			const collection = await createTestCollection(db, workspace.id, user.id, {
				name: "To Delete",
			});

			const drizzleDb = createDb(db);
			const collectionData = createCollectionData(drizzleDb);

			const deletedCollection: Collection = {
				...collection,
				deletedAt: Date.now(),
				updatedAt: Date.now(),
			};

			await collectionData.batchUpsert([deletedCollection]);

			const collections = await collectionData.findByUserId(user.id, 0);

			expect(collections).toHaveLength(1);
			expect(collections[0].deletedAt).toBeDefined();
			expect(collections[0].deletedAt).toBeGreaterThan(0);
		});
	});

	describe("Tab Operations", () => {
		it("should create new tabs", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("push-tab-create"),
				"Test User",
			);

			const workspace = await createTestWorkspace(db, user.id, {
				name: "Test Workspace",
			});

			const collection = await createTestCollection(db, workspace.id, user.id, {
				name: "Test Collection",
			});

			const drizzleDb = createDb(db);
			const tabData = createTabData(drizzleDb);

			const newTab: TabItem = {
				id: crypto.randomUUID(),
				collectionId: collection.id,
				userId: user.id,
				url: "https://example.com",
				title: "Example",
				order: 0,
				isPinned: false,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			await tabData.batchUpsert([newTab]);

			const tabs = await tabData.findByUserId(user.id, 0);

			expect(tabs).toHaveLength(1);
			expect(tabs[0].id).toBe(newTab.id);
			expect(tabs[0].url).toBe("https://example.com");
			expect(tabs[0].collectionId).toBe(collection.id);
		});

		it("should update existing tabs", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("push-tab-update"),
				"Test User",
			);

			const workspace = await createTestWorkspace(db, user.id, {
				name: "Test Workspace",
			});

			const collection = await createTestCollection(db, workspace.id, user.id, {
				name: "Test Collection",
			});

			const tab = await createTestTab(db, collection.id, user.id, {
				url: "https://old.com",
				title: "Old Title",
			});

			const drizzleDb = createDb(db);
			const tabData = createTabData(drizzleDb);

			const updatedTab: TabItem = {
				...tab,
				url: "https://new.com",
				title: "New Title",
				isPinned: true,
				updatedAt: Date.now(),
			};

			await tabData.batchUpsert([updatedTab]);

			const tabs = await tabData.findByUserId(user.id, 0);

			expect(tabs).toHaveLength(1);
			expect(tabs[0].url).toBe("https://new.com");
			expect(tabs[0].title).toBe("New Title");
			expect(tabs[0].isPinned).toBe(true);
		});

		it("should soft delete tabs", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("push-tab-delete"),
				"Test User",
			);

			const workspace = await createTestWorkspace(db, user.id, {
				name: "Test Workspace",
			});

			const collection = await createTestCollection(db, workspace.id, user.id, {
				name: "Test Collection",
			});

			const tab = await createTestTab(db, collection.id, user.id, {
				url: "https://example.com",
				title: "To Delete",
			});

			const drizzleDb = createDb(db);
			const tabData = createTabData(drizzleDb);

			const deletedTab: TabItem = {
				...tab,
				deletedAt: Date.now(),
				updatedAt: Date.now(),
			};

			await tabData.batchUpsert([deletedTab]);

			const tabs = await tabData.findByUserId(user.id, 0);

			expect(tabs).toHaveLength(1);
			expect(tabs[0].deletedAt).toBeDefined();
			expect(tabs[0].deletedAt).toBeGreaterThan(0);
		});
	});
});
