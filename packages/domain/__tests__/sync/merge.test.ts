import { describe, expect, it } from "vitest";
import {
	filterDeleted,
	mergeWithTombstones,
	type SyncStats,
} from "../../src/sync/merge";
import type { Collection, TabItem, Workspace } from "../../src/types";

describe("Sync Merge", () => {
	describe("mergeWithTombstones", () => {
		it("should keep local items when no incoming items", () => {
			const local: Workspace[] = [
				{
					id: "w1",
					userId: "user1",
					name: "Workspace 1",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];
			const incoming: Workspace[] = [];
			const stats: SyncStats = { lastPulledAt: 0 };

			const result = mergeWithTombstones(local, incoming, stats);

			expect(result).toEqual(local);
		});

		it("should add new incoming items", () => {
			const local: Workspace[] = [];
			const incoming: Workspace[] = [
				{
					id: "w1",
					userId: "user1",
					name: "Workspace 1",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];
			const stats: SyncStats = { lastPulledAt: 0 };

			const result = mergeWithTombstones(local, incoming, stats);

			expect(result).toEqual(incoming);
		});

		it("should keep newer version based on updatedAt", () => {
			const local: Workspace[] = [
				{
					id: "w1",
					userId: "user1",
					name: "Local Name",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 2000,
					deletedAt: null,
				},
			];
			const incoming: Workspace[] = [
				{
					id: "w1",
					userId: "user1",
					name: "Remote Name",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 1500,
					deletedAt: null,
				},
			];
			const stats: SyncStats = { lastPulledAt: 0 };

			const result = mergeWithTombstones(local, incoming, stats);

			expect(result[0].name).toBe("Local Name");
			expect(result[0].updatedAt).toBe(2000);
		});

		it("should handle tombstones (deletedAt)", () => {
			const local: Workspace[] = [
				{
					id: "w1",
					userId: "user1",
					name: "Workspace 1",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];
			const incoming: Workspace[] = [
				{
					id: "w1",
					userId: "user1",
					name: "Workspace 1",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 2000,
					deletedAt: 2000,
				},
			];
			const stats: SyncStats = { lastPulledAt: 0 };

			const result = mergeWithTombstones(local, incoming, stats);

			expect(result[0].deletedAt).toBe(2000);
		});

		it("should merge multiple items correctly", () => {
			const local: Workspace[] = [
				{
					id: "w1",
					userId: "user1",
					name: "Local 1",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 2000,
					deletedAt: null,
				},
				{
					id: "w2",
					userId: "user1",
					name: "Local 2",
					description: null,
					order: 1,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];
			const incoming: Workspace[] = [
				{
					id: "w1",
					userId: "user1",
					name: "Remote 1",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 1500,
					deletedAt: null,
				},
				{
					id: "w3",
					userId: "user1",
					name: "Remote 3",
					description: null,
					order: 2,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];
			const stats: SyncStats = { lastPulledAt: 0 };

			const result = mergeWithTombstones(local, incoming, stats);

			expect(result).toHaveLength(3);
			expect(result.find((w) => w.id === "w1")?.name).toBe("Local 1");
			expect(result.find((w) => w.id === "w2")?.name).toBe("Local 2");
			expect(result.find((w) => w.id === "w3")?.name).toBe("Remote 3");
		});
	});

	describe("filterDeleted", () => {
		it("should remove items with deletedAt", () => {
			const items: Workspace[] = [
				{
					id: "w1",
					userId: "user1",
					name: "Active",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
				{
					id: "w2",
					userId: "user1",
					name: "Deleted",
					description: null,
					order: 1,
					createdAt: 1000,
					updatedAt: 2000,
					deletedAt: 2000,
				},
			];

			const result = filterDeleted(items);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("w1");
		});

		it("should keep all items when none are deleted", () => {
			const items: Workspace[] = [
				{
					id: "w1",
					userId: "user1",
					name: "Active 1",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
				{
					id: "w2",
					userId: "user1",
					name: "Active 2",
					description: null,
					order: 1,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];

			const result = filterDeleted(items);

			expect(result).toHaveLength(2);
		});

		it("should handle empty array", () => {
			const result = filterDeleted([]);
			expect(result).toEqual([]);
		});
	});
});
