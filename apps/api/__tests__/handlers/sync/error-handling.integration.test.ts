import type { Collection, TabItem, Workspace } from "@aura/domain";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getPlatformProxy } from "wrangler";
import { createCollectionData } from "@/data/collection.data";
import { createTabData } from "@/data/tab.data";
import { createWorkspaceData } from "@/data/workspace.data";
import { createDb } from "@/db";
import { expectOk } from "../../helpers/result-helpers";
import { createMockUser } from "../../helpers/test-auth";
import {
	createTestCollection,
	createTestWorkspace,
} from "../../helpers/test-data";
import { cleanupTestDb, initTestDb } from "../../helpers/test-db";
import { generateTestEmail } from "../../helpers/test-env";

/**
 * Integration tests for error handling in sync data layer
 * Tests database constraints, foreign key violations, and edge cases
 */
describe("Sync Error Handling Integration", () => {
	let cleanup: () => Promise<void>;
	let db: D1Database;

	beforeEach(async () => {
		const proxy = await getPlatformProxy();
		db = proxy.env.DB as D1Database;

		await initTestDb(db);

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

	describe("Foreign Key Constraints", () => {
		it("should fail when creating collection with non-existent workspace", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("fk-collection"),
				"Test User",
			);

			const drizzleDb = createDb(db);
			const collectionData = createCollectionData(drizzleDb);

			const invalidCollection: Collection = {
				id: crypto.randomUUID(),
				workspaceId: "non-existent-workspace-id",
				userId: user.id,
				name: "Invalid Collection",
				order: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			await expect(
				collectionData.batchUpsert([invalidCollection]),
			).rejects.toThrow();
		});

		it("should fail when creating tab with non-existent collection", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("fk-tab"),
				"Test User",
			);

			const drizzleDb = createDb(db);
			const tabData = createTabData(drizzleDb);

			const invalidTab: TabItem = {
				id: crypto.randomUUID(),
				collectionId: "non-existent-collection-id",
				userId: user.id,
				url: "https://example.com",
				title: "Invalid Tab",
				order: 0,
				isPinned: false,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			await expect(tabData.batchUpsert([invalidTab])).rejects.toThrow();
		});
	});

	describe("Cascade Delete", () => {
		it("should cascade delete collections when workspace is deleted", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("cascade-workspace"),
				"Test User",
			);

			const workspace = await createTestWorkspace(db, user.id, {
				name: "Test Workspace",
			});

			const collection = await createTestCollection(db, workspace.id, user.id, {
				name: "Test Collection",
			});

			const drizzleDb = createDb(db);
			const workspaceData = createWorkspaceData(drizzleDb);
			const collectionData = createCollectionData(drizzleDb);

			await workspaceData.batchDelete([workspace.id]);

			const collections = await collectionData.findByUserId(user.id, 0);
			expect(collections).toHaveLength(0);
		});

		it("should cascade delete tabs when collection is deleted", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("cascade-collection"),
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
			const collectionData = createCollectionData(drizzleDb);

			const tab: TabItem = {
				id: crypto.randomUUID(),
				collectionId: collection.id,
				userId: user.id,
				url: "https://example.com",
				title: "Test Tab",
				order: 0,
				isPinned: false,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			await tabData.batchUpsert([tab]);

			await collectionData.batchDelete([collection.id]);

			const tabs = await tabData.findByUserId(user.id, 0);
			expect(tabs).toHaveLength(0);
		});
	});

	describe("Empty Data Handling", () => {
		it("should handle empty arrays gracefully", async () => {
			const drizzleDb = createDb(db);
			const workspaceData = createWorkspaceData(drizzleDb);
			const collectionData = createCollectionData(drizzleDb);
			const tabData = createTabData(drizzleDb);

			await expect(workspaceData.batchUpsert([])).resolves.not.toThrow();
			await expect(collectionData.batchUpsert([])).resolves.not.toThrow();
			await expect(tabData.batchUpsert([])).resolves.not.toThrow();

			await expect(workspaceData.batchDelete([])).resolves.not.toThrow();
			await expect(collectionData.batchDelete([])).resolves.not.toThrow();
			await expect(tabData.batchDelete([])).resolves.not.toThrow();
		});

		it("should return empty arrays for non-existent user", async () => {
			const drizzleDb = createDb(db);
			const workspaceData = createWorkspaceData(drizzleDb);
			const collectionData = createCollectionData(drizzleDb);
			const tabData = createTabData(drizzleDb);

			const nonExistentUserId = "non-existent-user-id";

			const workspaces = expectOk(
				await workspaceData.findByUserId(nonExistentUserId, 0),
			);
			const collections = await collectionData.findByUserId(
				nonExistentUserId,
				0,
			);
			const tabs = await tabData.findByUserId(nonExistentUserId, 0);

			expect(workspaces).toEqual([]);
			expect(collections).toEqual([]);
			expect(tabs).toEqual([]);
		});
	});

	describe("Duplicate ID Handling", () => {
		it("should update workspace when inserting with same ID", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("duplicate-workspace"),
				"Test User",
			);

			const drizzleDb = createDb(db);
			const workspaceData = createWorkspaceData(drizzleDb);

			const workspaceId = crypto.randomUUID();
			const workspace1: Workspace = {
				id: workspaceId,
				userId: user.id,
				name: "Original Name",
				order: 0,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			await workspaceData.batchUpsert([workspace1]);

			const workspace2: Workspace = {
				id: workspaceId,
				userId: user.id,
				name: "Updated Name",
				order: 1,
				createdAt: workspace1.createdAt,
				updatedAt: Date.now(),
			};

			await workspaceData.batchUpsert([workspace2]);

			const workspaces = expectOk(await workspaceData.findByUserId(user.id, 0));

			expect(workspaces).toHaveLength(1);
			expect(workspaces[0].name).toBe("Updated Name");
			expect(workspaces[0].order).toBe(1);
		});
	});

	describe("Large Batch Operations", () => {
		it("should handle large batch of workspaces", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("large-batch"),
				"Test User",
			);

			const drizzleDb = createDb(db);
			const workspaceData = createWorkspaceData(drizzleDb);

			const workspaces: Workspace[] = Array.from({ length: 50 }, (_, i) => ({
				id: crypto.randomUUID(),
				userId: user.id,
				name: `Workspace ${i}`,
				order: i,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			}));

			await workspaceData.batchUpsert(workspaces);

			const result = expectOk(await workspaceData.findByUserId(user.id, 0));

			expect(result).toHaveLength(50);
		});
	});

	describe("Timestamp Edge Cases", () => {
		it("should handle very old timestamps", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("old-timestamp"),
				"Test User",
			);

			const drizzleDb = createDb(db);
			const workspaceData = createWorkspaceData(drizzleDb);

			const oldTimestamp = 1000;
			const workspace: Workspace = {
				id: crypto.randomUUID(),
				userId: user.id,
				name: "Old Workspace",
				order: 0,
				createdAt: oldTimestamp,
				updatedAt: oldTimestamp,
			};

			await workspaceData.batchUpsert([workspace]);

			const workspaces = expectOk(await workspaceData.findByUserId(user.id, 0));

			expect(workspaces).toHaveLength(1);
			expect(workspaces[0].createdAt).toBe(oldTimestamp);
		});

		it("should filter by timestamp correctly", async () => {
			const user = await createMockUser(
				db,
				generateTestEmail("timestamp-filter"),
				"Test User",
			);

			const drizzleDb = createDb(db);
			const workspaceData = createWorkspaceData(drizzleDb);

			const now = Date.now();
			const workspace1: Workspace = {
				id: crypto.randomUUID(),
				userId: user.id,
				name: "Old Workspace",
				order: 0,
				createdAt: now - 10000,
				updatedAt: now - 10000,
			};

			const workspace2: Workspace = {
				id: crypto.randomUUID(),
				userId: user.id,
				name: "New Workspace",
				order: 1,
				createdAt: now,
				updatedAt: now,
			};

			await workspaceData.batchUpsert([workspace1, workspace2]);

			const recentWorkspaces = expectOk(
				await workspaceData.findByUserId(user.id, now - 5000),
			);

			expect(recentWorkspaces).toHaveLength(1);
			expect(recentWorkspaces[0].name).toBe("New Workspace");
		});
	});
});
