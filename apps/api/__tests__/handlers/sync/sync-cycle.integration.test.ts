import type { Collection, TabItem, Workspace } from "@aura/domain";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getPlatformProxy } from "wrangler";
import { createCollectionData } from "@/data/collection.data";
import { createTabData } from "@/data/tab.data";
import { createWorkspaceData } from "@/data/workspace.data";
import { createDb } from "@/db";
import { createMockUser } from "../../helpers/test-auth";
import { cleanupTestDb, initTestDb } from "../../helpers/test-db";
import { generateTestEmail } from "../../helpers/test-env";

/**
 * Integration tests for complete sync cycle (pull -> push -> pull)
 * Tests the full synchronization workflow
 */
describe("Sync Cycle Integration", () => {
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

	it("should complete full sync cycle: pull -> push -> pull", async () => {
		const user = await createMockUser(
			db,
			generateTestEmail("sync-cycle"),
			"Test User",
		);

		const drizzleDb = createDb(db);
		const workspaceData = createWorkspaceData(drizzleDb);
		const collectionData = createCollectionData(drizzleDb);
		const tabData = createTabData(drizzleDb);

		// Step 1: Initial pull (should be empty)
		const [initialWorkspaces, initialCollections, initialTabs] =
			await Promise.all([
				workspaceData.findByUserId(user.id, 0),
				collectionData.findByUserId(user.id, 0),
				tabData.findByUserId(user.id, 0),
			]);

		expect(initialWorkspaces).toHaveLength(0);
		expect(initialCollections).toHaveLength(0);
		expect(initialTabs).toHaveLength(0);

		// Step 2: Push new data
		const workspace: Workspace = {
			id: crypto.randomUUID(),
			userId: user.id,
			name: "Synced Workspace",
			order: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		const collection: Collection = {
			id: crypto.randomUUID(),
			workspaceId: workspace.id,
			userId: user.id,
			name: "Synced Collection",
			order: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		const tab: TabItem = {
			id: crypto.randomUUID(),
			collectionId: collection.id,
			userId: user.id,
			url: "https://synced.com",
			title: "Synced Tab",
			order: 0,
			isPinned: false,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await Promise.all([
			workspaceData.batchUpsert([workspace]),
			collectionData.batchUpsert([collection]),
			tabData.batchUpsert([tab]),
		]);

		// Step 3: Pull again (should get the pushed data)
		const [pulledWorkspaces, pulledCollections, pulledTabs] = await Promise.all(
			[
				workspaceData.findByUserId(user.id, 0),
				collectionData.findByUserId(user.id, 0),
				tabData.findByUserId(user.id, 0),
			],
		);

		expect(pulledWorkspaces).toHaveLength(1);
		expect(pulledWorkspaces[0].id).toBe(workspace.id);
		expect(pulledWorkspaces[0].name).toBe("Synced Workspace");

		expect(pulledCollections).toHaveLength(1);
		expect(pulledCollections[0].id).toBe(collection.id);
		expect(pulledCollections[0].workspaceId).toBe(workspace.id);

		expect(pulledTabs).toHaveLength(1);
		expect(pulledTabs[0].id).toBe(tab.id);
		expect(pulledTabs[0].collectionId).toBe(collection.id);
		expect(pulledTabs[0].url).toBe("https://synced.com");
	});

	it("should handle incremental sync correctly", async () => {
		const user = await createMockUser(
			db,
			generateTestEmail("incremental-sync"),
			"Test User",
		);

		const drizzleDb = createDb(db);
		const workspaceData = createWorkspaceData(drizzleDb);

		// Create initial workspace
		const workspace1: Workspace = {
			id: crypto.randomUUID(),
			userId: user.id,
			name: "Workspace 1",
			order: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await workspaceData.batchUpsert([workspace1]);

		const firstSyncTime = Date.now();

		// Wait a bit to ensure timestamp difference
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Create second workspace after first sync
		const workspace2: Workspace = {
			id: crypto.randomUUID(),
			userId: user.id,
			name: "Workspace 2",
			order: 1,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await workspaceData.batchUpsert([workspace2]);

		// Pull with firstSyncTime - should only get workspace2
		const incrementalWorkspaces = await workspaceData.findByUserId(
			user.id,
			firstSyncTime,
		);

		expect(incrementalWorkspaces).toHaveLength(1);
		expect(incrementalWorkspaces[0].id).toBe(workspace2.id);
		expect(incrementalWorkspaces[0].name).toBe("Workspace 2");
	});

	it("should handle concurrent updates with last-write-wins", async () => {
		const user = await createMockUser(
			db,
			generateTestEmail("concurrent-updates"),
			"Test User",
		);

		const drizzleDb = createDb(db);
		const workspaceData = createWorkspaceData(drizzleDb);

		// Create initial workspace
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

		// Simulate concurrent update with newer timestamp
		const workspace2: Workspace = {
			...workspace1,
			name: "Updated Name",
			updatedAt: Date.now() + 1000, // 1 second later
		};

		await workspaceData.batchUpsert([workspace2]);

		// Pull should get the latest version
		const workspaces = await workspaceData.findByUserId(user.id, 0);

		expect(workspaces).toHaveLength(1);
		expect(workspaces[0].name).toBe("Updated Name");
		expect(workspaces[0].updatedAt).toBe(workspace2.updatedAt);
	});

	it("should maintain data consistency across multiple entities", async () => {
		const user = await createMockUser(
			db,
			generateTestEmail("data-consistency"),
			"Test User",
		);

		const drizzleDb = createDb(db);
		const workspaceData = createWorkspaceData(drizzleDb);
		const collectionData = createCollectionData(drizzleDb);
		const tabData = createTabData(drizzleDb);

		// Create a complete hierarchy
		const workspace: Workspace = {
			id: crypto.randomUUID(),
			userId: user.id,
			name: "Workspace",
			order: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		const collection: Collection = {
			id: crypto.randomUUID(),
			workspaceId: workspace.id,
			userId: user.id,
			name: "Collection",
			order: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		const tabs: TabItem[] = Array.from({ length: 3 }, (_, i) => ({
			id: crypto.randomUUID(),
			collectionId: collection.id,
			userId: user.id,
			url: `https://example${i + 1}.com`,
			title: `Tab ${i + 1}`,
			order: i,
			isPinned: false,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		}));

		// Push all data
		await Promise.all([
			workspaceData.batchUpsert([workspace]),
			collectionData.batchUpsert([collection]),
			tabData.batchUpsert(tabs),
		]);

		// Pull and verify relationships
		const [pulledWorkspaces, pulledCollections, pulledTabs] = await Promise.all(
			[
				workspaceData.findByUserId(user.id, 0),
				collectionData.findByUserId(user.id, 0),
				tabData.findByUserId(user.id, 0),
			],
		);

		expect(pulledWorkspaces).toHaveLength(1);
		expect(pulledCollections).toHaveLength(1);
		expect(pulledTabs).toHaveLength(3);

		// Verify relationships
		expect(pulledCollections[0].workspaceId).toBe(workspace.id);
		pulledTabs.forEach((tab) => {
			expect(tab.collectionId).toBe(collection.id);
		});
	});

	it("should handle soft deletes in sync cycle", async () => {
		const user = await createMockUser(
			db,
			generateTestEmail("soft-delete-sync"),
			"Test User",
		);

		const drizzleDb = createDb(db);
		const workspaceData = createWorkspaceData(drizzleDb);

		// Create workspace
		const workspace: Workspace = {
			id: crypto.randomUUID(),
			userId: user.id,
			name: "To Delete",
			order: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await workspaceData.batchUpsert([workspace]);

		// Verify it exists
		let workspaces = await workspaceData.findByUserId(user.id, 0);
		expect(workspaces).toHaveLength(1);
		expect(workspaces[0].deletedAt).toBeNull();

		// Soft delete
		const deletedWorkspace: Workspace = {
			...workspace,
			deletedAt: Date.now(),
			updatedAt: Date.now(),
		};

		await workspaceData.batchUpsert([deletedWorkspace]);

		// Pull should still include deleted item
		workspaces = await workspaceData.findByUserId(user.id, 0);
		expect(workspaces).toHaveLength(1);
		expect(workspaces[0].deletedAt).toBeDefined();
		expect(workspaces[0].deletedAt).toBeGreaterThan(0);
	});
});
