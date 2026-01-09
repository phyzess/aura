import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createCollection,
	getCollectionsByWorkspace,
	markCollectionAsDeleted,
	reorderCollection,
	updateCollection,
} from "../../src/features/collection/domain";
import type { Collection } from "../../src/types";

describe("Collection Operations", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
	});

	describe("createCollection", () => {
		it("should create collection with required fields", () => {
			const collection = createCollection({
				workspaceId: "w1",
				name: "My Collection",
				order: 0,
			});

			expect(collection.id).toBeDefined();
			expect(collection.workspaceId).toBe("w1");
			expect(collection.name).toBe("My Collection");
			expect(collection.order).toBe(0);
			expect(collection.description).toBeUndefined();
			expect(collection.createdAt).toBe(Date.now());
			expect(collection.updatedAt).toBe(Date.now());
			expect(collection.deletedAt).toBeUndefined();
		});

		it("should create collection with description", () => {
			const collection = createCollection({
				workspaceId: "w1",
				name: "My Collection",
				description: "Test description",
				order: 0,
			});

			expect(collection.description).toBe("Test description");
		});

		it("should generate unique IDs for different collections", () => {
			const collection1 = createCollection({
				workspaceId: "w1",
				name: "Collection 1",
				order: 0,
			});
			const collection2 = createCollection({
				workspaceId: "w1",
				name: "Collection 2",
				order: 1,
			});

			expect(collection1.id).not.toBe(collection2.id);
		});
	});

	describe("updateCollection", () => {
		it("should update collection name", () => {
			const original: Collection = {
				id: "c1",
				workspaceId: "w1",
				name: "Original",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const updated = updateCollection(original, { name: "Updated" });

			expect(updated.name).toBe("Updated");
			expect(updated.updatedAt).toBe(Date.now());
			expect(updated.createdAt).toBe(1000);
		});

		it("should update collection description", () => {
			const original: Collection = {
				id: "c1",
				workspaceId: "w1",
				name: "Collection",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const updated = updateCollection(original, {
				description: "New description",
			});

			expect(updated.description).toBe("New description");
		});

		it("should update multiple fields", () => {
			const original: Collection = {
				id: "c1",
				workspaceId: "w1",
				name: "Original",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const updated = updateCollection(original, {
				name: "Updated",
				description: "New description",
				order: 5,
			});

			expect(updated.name).toBe("Updated");
			expect(updated.description).toBe("New description");
			expect(updated.order).toBe(5);
		});

		it("should not modify original collection", () => {
			const original: Collection = {
				id: "c1",
				workspaceId: "w1",
				name: "Original",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			updateCollection(original, { name: "Updated" });

			expect(original.name).toBe("Original");
		});
	});

	describe("markCollectionAsDeleted", () => {
		it("should mark collection as deleted", () => {
			const collection: Collection = {
				id: "c1",
				workspaceId: "w1",
				name: "Collection",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const deleted = markCollectionAsDeleted(collection);

			expect(deleted.deletedAt).toBe(Date.now());
			expect(deleted.updatedAt).toBe(Date.now());
		});

		it("should not modify original collection", () => {
			const collection: Collection = {
				id: "c1",
				workspaceId: "w1",
				name: "Collection",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			markCollectionAsDeleted(collection);

			expect(collection.deletedAt).toBeUndefined();
		});
	});

	describe("reorderCollection", () => {
		it("should update collection order", () => {
			const collection: Collection = {
				id: "c1",
				workspaceId: "w1",
				name: "Collection",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const reordered = reorderCollection(collection, 5);

			expect(reordered.order).toBe(5);
			expect(reordered.updatedAt).toBe(Date.now());
		});

		it("should not modify original collection", () => {
			const collection: Collection = {
				id: "c1",
				workspaceId: "w1",
				name: "Collection",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			reorderCollection(collection, 5);

			expect(collection.order).toBe(0);
		});
	});

	describe("getCollectionsByWorkspace", () => {
		it("should return only collections for specified workspace", () => {
			const collections: Collection[] = [
				{
					id: "c1",
					workspaceId: "w1",
					name: "Collection 1",
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "c2",
					workspaceId: "w2",
					name: "Collection 2",
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "c3",
					workspaceId: "w1",
					name: "Collection 3",
					order: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
			];

			const result = getCollectionsByWorkspace(collections, "w1");

			expect(result).toHaveLength(2);
			expect(result.map((c) => c.id)).toEqual(["c1", "c3"]);
		});

		it("should exclude deleted collections", () => {
			const collections: Collection[] = [
				{
					id: "c1",
					workspaceId: "w1",
					name: "Active",
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "c2",
					workspaceId: "w1",
					name: "Deleted",
					order: 1,
					createdAt: 1000,
					updatedAt: 2000,
					deletedAt: 2000,
				},
			];

			const result = getCollectionsByWorkspace(collections, "w1");

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("c1");
		});

		it("should return empty array when no collections match", () => {
			const collections: Collection[] = [
				{
					id: "c1",
					workspaceId: "w1",
					name: "Collection 1",
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
			];

			const result = getCollectionsByWorkspace(collections, "w2");

			expect(result).toEqual([]);
		});

		it("should handle empty array", () => {
			const result = getCollectionsByWorkspace([], "w1");

			expect(result).toEqual([]);
		});
	});
});
