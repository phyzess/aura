import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
 * Integration tests for sync/pull data layer
 * Tests the data access layer directly without HTTP handlers
 */
describe("Sync Pull Data Layer Integration", () => {
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

	it("should return empty arrays for new user", async () => {
		// Arrange
		const user = await createMockUser(
			db,
			generateTestEmail("pull-empty"),
			"Empty User",
		);

		const drizzleDb = createDb(db);
		const workspaceData = createWorkspaceData(drizzleDb);
		const collectionData = createCollectionData(drizzleDb);
		const tabData = createTabData(drizzleDb);

		// Act
		const [workspaces, collections, tabs] = await Promise.all([
			workspaceData.findByUserId(user.id, 0),
			collectionData.findByUserId(user.id, 0),
			tabData.findByUserId(user.id, 0),
		]);

		// Assert
		expect(workspaces).toEqual([]);
		expect(collections).toEqual([]);
		expect(tabs).toEqual([]);
	});

	it("should return all user data on initial sync", async () => {
		// Arrange
		const user = await createMockUser(
			db,
			generateTestEmail("pull-initial"),
			"Initial User",
		);

		const workspace = await createTestWorkspace(db, user.id, {
			name: "My Workspace",
			order: 0,
		});

		const collection = await createTestCollection(db, workspace.id, user.id, {
			name: "My Collection",
			order: 0,
		});

		const tab1 = await createTestTab(db, collection.id, user.id, {
			url: "https://google.com",
			title: "Google",
			order: 0,
		});

		const tab2 = await createTestTab(db, collection.id, user.id, {
			url: "https://github.com",
			title: "GitHub",
			order: 1,
			isPinned: true,
		});

		const drizzleDb = createDb(db);
		const workspaceData = createWorkspaceData(drizzleDb);
		const collectionData = createCollectionData(drizzleDb);
		const tabData = createTabData(drizzleDb);

		// Act
		const [workspaces, collections, tabs] = await Promise.all([
			workspaceData.findByUserId(user.id, 0),
			collectionData.findByUserId(user.id, 0),
			tabData.findByUserId(user.id, 0),
		]);

		// Assert
		expect(workspaces).toHaveLength(1);
		expect(workspaces[0].id).toBe(workspace.id);
		expect(workspaces[0].name).toBe("My Workspace");

		expect(collections).toHaveLength(1);
		expect(collections[0].id).toBe(collection.id);
		expect(collections[0].workspaceId).toBe(workspace.id);

		expect(tabs).toHaveLength(2);
		const returnedTab1 = tabs.find((t) => t.id === tab1.id);
		const returnedTab2 = tabs.find((t) => t.id === tab2.id);

		expect(returnedTab1).toBeDefined();
		expect(returnedTab1?.url).toBe("https://google.com");
		expect(returnedTab1?.isPinned).toBe(false);

		expect(returnedTab2).toBeDefined();
		expect(returnedTab2?.url).toBe("https://github.com");
		expect(returnedTab2?.isPinned).toBe(true);
	});

	it("should return only updated data after lastSyncTimestamp", async () => {
		// Arrange
		const user = await createMockUser(
			db,
			generateTestEmail("pull-incremental"),
			"Incremental User",
		);

		const oldTimestamp = Date.now() - 10000; // 10 seconds ago
		const newTimestamp = Date.now();

		// Old workspace (should not be returned)
		await createTestWorkspace(db, user.id, {
			name: "Old Workspace",
			createdAt: oldTimestamp,
			updatedAt: oldTimestamp,
		});

		// New workspace (should be returned)
		const newWorkspace = await createTestWorkspace(db, user.id, {
			name: "New Workspace",
			createdAt: newTimestamp,
			updatedAt: newTimestamp,
		});

		const drizzleDb = createDb(db);
		const workspaceData = createWorkspaceData(drizzleDb);

		// Act: Query with lastSyncTimestamp set to old timestamp + 1
		const workspaces = await workspaceData.findByUserId(
			user.id,
			oldTimestamp + 1,
		);

		// Assert: Should only return new workspace
		expect(workspaces).toHaveLength(1);
		expect(workspaces[0].id).toBe(newWorkspace.id);
		expect(workspaces[0].name).toBe("New Workspace");
	});

	it("should include soft-deleted items in sync", async () => {
		// Arrange
		const user = await createMockUser(
			db,
			generateTestEmail("pull-deleted"),
			"Deleted User",
		);

		const deletedWorkspace = await createTestWorkspace(db, user.id, {
			name: "Deleted Workspace",
			deletedAt: Date.now(),
		});

		const drizzleDb = createDb(db);
		const workspaceData = createWorkspaceData(drizzleDb);

		// Act
		const workspaces = await workspaceData.findByUserId(user.id, 0);

		// Assert: Should include deleted workspace
		expect(workspaces).toHaveLength(1);
		expect(workspaces[0].id).toBe(deletedWorkspace.id);
		expect(workspaces[0].deletedAt).toBeDefined();
		expect(workspaces[0].deletedAt).toBeGreaterThan(0);
	});

	it("should not return data from other users", async () => {
		// Arrange
		const user1 = await createMockUser(
			db,
			generateTestEmail("user1"),
			"User 1",
		);
		const user2 = await createMockUser(
			db,
			generateTestEmail("user2"),
			"User 2",
		);

		// Create workspace for user1
		await createTestWorkspace(db, user1.id, {
			name: "User 1 Workspace",
		});

		// Create workspace for user2
		await createTestWorkspace(db, user2.id, {
			name: "User 2 Workspace",
		});

		const drizzleDb = createDb(db);
		const workspaceData = createWorkspaceData(drizzleDb);

		// Act: Query user1's data
		const user1Workspaces = await workspaceData.findByUserId(user1.id, 0);

		// Assert: Should only return user1's workspace
		expect(user1Workspaces).toHaveLength(1);
		expect(user1Workspaces[0].name).toBe("User 1 Workspace");
		expect(user1Workspaces[0].userId).toBe(user1.id);
	});
});
