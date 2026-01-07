import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createWorkspace,
	getActiveWorkspaces,
	markWorkspaceAsDeleted,
	reorderWorkspace,
	sortWorkspacesByOrder,
	updateWorkspace,
} from "../../src/domain/workspace/operations";
import type { Workspace } from "../../src/types";

describe("Workspace Operations", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
	});

	describe("createWorkspace", () => {
		it("should create workspace with required fields", () => {
			const workspace = createWorkspace({
				name: "My Workspace",
				order: 0,
			});

			expect(workspace.id).toBeDefined();
			expect(workspace.name).toBe("My Workspace");
			expect(workspace.order).toBe(0);
			expect(workspace.description).toBeUndefined();
			expect(workspace.createdAt).toBe(Date.now());
			expect(workspace.updatedAt).toBe(Date.now());
			expect(workspace.deletedAt).toBeUndefined();
		});

		it("should create workspace with description", () => {
			const workspace = createWorkspace({
				name: "My Workspace",
				description: "Test description",
				order: 0,
			});

			expect(workspace.description).toBe("Test description");
		});

		it("should generate unique IDs for different workspaces", () => {
			const workspace1 = createWorkspace({ name: "Workspace 1", order: 0 });
			const workspace2 = createWorkspace({ name: "Workspace 2", order: 1 });

			expect(workspace1.id).not.toBe(workspace2.id);
		});
	});

	describe("updateWorkspace", () => {
		it("should update workspace name", () => {
			const original: Workspace = {
				id: "w1",
				name: "Original",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const updated = updateWorkspace(original, { name: "Updated" });

			expect(updated.name).toBe("Updated");
			expect(updated.updatedAt).toBe(Date.now());
			expect(updated.createdAt).toBe(1000);
		});

		it("should update workspace description", () => {
			const original: Workspace = {
				id: "w1",
				name: "Workspace",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const updated = updateWorkspace(original, {
				description: "New description",
			});

			expect(updated.description).toBe("New description");
		});

		it("should update multiple fields", () => {
			const original: Workspace = {
				id: "w1",
				name: "Original",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const updated = updateWorkspace(original, {
				name: "Updated",
				description: "New description",
				order: 5,
			});

			expect(updated.name).toBe("Updated");
			expect(updated.description).toBe("New description");
			expect(updated.order).toBe(5);
		});

		it("should not modify original workspace", () => {
			const original: Workspace = {
				id: "w1",
				name: "Original",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			updateWorkspace(original, { name: "Updated" });

			expect(original.name).toBe("Original");
		});
	});

	describe("markWorkspaceAsDeleted", () => {
		it("should mark workspace as deleted", () => {
			const workspace: Workspace = {
				id: "w1",
				name: "Workspace",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const deleted = markWorkspaceAsDeleted(workspace);

			expect(deleted.deletedAt).toBe(Date.now());
			expect(deleted.updatedAt).toBe(Date.now());
		});

		it("should not modify original workspace", () => {
			const workspace: Workspace = {
				id: "w1",
				name: "Workspace",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			markWorkspaceAsDeleted(workspace);

			expect(workspace.deletedAt).toBeUndefined();
		});
	});

	describe("reorderWorkspace", () => {
		it("should update workspace order", () => {
			const workspace: Workspace = {
				id: "w1",
				name: "Workspace",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const reordered = reorderWorkspace(workspace, 5);

			expect(reordered.order).toBe(5);
			expect(reordered.updatedAt).toBe(Date.now());
		});

		it("should not modify original workspace", () => {
			const workspace: Workspace = {
				id: "w1",
				name: "Workspace",
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			reorderWorkspace(workspace, 5);

			expect(workspace.order).toBe(0);
		});
	});

	describe("getActiveWorkspaces", () => {
		it("should return only non-deleted workspaces", () => {
			const workspaces: Workspace[] = [
				{
					id: "w1",
					name: "Active 1",
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "w2",
					name: "Deleted",
					order: 1,
					createdAt: 1000,
					updatedAt: 2000,
					deletedAt: 2000,
				},
				{
					id: "w3",
					name: "Active 2",
					order: 2,
					createdAt: 1000,
					updatedAt: 1000,
				},
			];

			const active = getActiveWorkspaces(workspaces);

			expect(active).toHaveLength(2);
			expect(active.map((w) => w.id)).toEqual(["w1", "w3"]);
		});

		it("should return empty array when all workspaces are deleted", () => {
			const workspaces: Workspace[] = [
				{
					id: "w1",
					name: "Deleted 1",
					order: 0,
					createdAt: 1000,
					updatedAt: 2000,
					deletedAt: 2000,
				},
			];

			const active = getActiveWorkspaces(workspaces);

			expect(active).toEqual([]);
		});

		it("should return all workspaces when none are deleted", () => {
			const workspaces: Workspace[] = [
				{
					id: "w1",
					name: "Active 1",
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "w2",
					name: "Active 2",
					order: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
			];

			const active = getActiveWorkspaces(workspaces);

			expect(active).toHaveLength(2);
		});
	});

	describe("sortWorkspacesByOrder", () => {
		it("should sort workspaces by order ascending", () => {
			const workspaces: Workspace[] = [
				{
					id: "w3",
					name: "Third",
					order: 2,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "w1",
					name: "First",
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "w2",
					name: "Second",
					order: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
			];

			const sorted = sortWorkspacesByOrder(workspaces);

			expect(sorted.map((w) => w.id)).toEqual(["w1", "w2", "w3"]);
		});

		it("should not modify original array", () => {
			const workspaces: Workspace[] = [
				{
					id: "w2",
					name: "Second",
					order: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "w1",
					name: "First",
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
			];

			sortWorkspacesByOrder(workspaces);

			expect(workspaces[0].id).toBe("w2");
		});

		it("should handle empty array", () => {
			const sorted = sortWorkspacesByOrder([]);

			expect(sorted).toEqual([]);
		});
	});
});
