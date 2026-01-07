import { describe, expect, it } from "vitest";
import {
	validateCollections,
	validateRelationships,
	validateTabs,
	validateWorkspaces,
} from "../../src/sync/validate";
import type { Collection, TabItem, Workspace } from "../../src/types";

describe("Sync Validate", () => {
	describe("validateWorkspaces", () => {
		it("should validate correct workspaces", () => {
			const workspaces: Workspace[] = [
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

			const result = validateWorkspaces(workspaces);

			expect(result).toEqual(workspaces);
		});

		it("should filter out invalid workspaces", () => {
			const workspaces = [
				{
					id: "w1",
					userId: "user1",
					name: "Valid",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
				{
					id: "w2",
					userId: "user1",
					name: "Missing order",
					description: null,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];

			const result = validateWorkspaces(workspaces as any);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("w1");
		});
	});

	describe("validateCollections", () => {
		it("should validate correct collections", () => {
			const collections: Collection[] = [
				{
					id: "c1",
					workspaceId: "w1",
					userId: "user1",
					name: "Collection 1",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];

			const result = validateCollections(collections);

			expect(result).toEqual(collections);
		});

		it("should filter out invalid collections", () => {
			const collections = [
				{
					id: "c1",
					workspaceId: "w1",
					userId: "user1",
					name: "Valid",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
				{
					id: "c2",
					workspaceId: "w2",
					userId: "user1",
					name: "Missing order",
					description: null,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];

			const result = validateCollections(collections as any);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("c1");
		});
	});

	describe("validateTabs", () => {
		it("should validate correct tabs", () => {
			const tabs: TabItem[] = [
				{
					id: "t1",
					collectionId: "c1",
					userId: "user1",
					url: "https://example.com",
					title: "Example",
					faviconUrl: null,
					isPinned: false,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];

			const result = validateTabs(tabs);

			expect(result).toEqual(tabs);
		});

		it("should filter out invalid tabs", () => {
			const tabs = [
				{
					id: "t1",
					collectionId: "c1",
					userId: "user1",
					url: "https://example.com",
					title: "Valid",
					faviconUrl: null,
					isPinned: false,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
				{
					id: "t2",
					collectionId: "c2",
					userId: "user1",
					url: "https://example.com",
					title: "Missing order",
					faviconUrl: null,
					isPinned: false,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];

			const result = validateTabs(tabs as any);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("t1");
		});
	});

	describe("validateRelationships", () => {
		it("should validate correct relationships", () => {
			const workspaces: Workspace[] = [
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
			const collections: Collection[] = [
				{
					id: "c1",
					workspaceId: "w1",
					userId: "user1",
					name: "Collection 1",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];
			const tabs: TabItem[] = [
				{
					id: "t1",
					collectionId: "c1",
					userId: "user1",
					url: "https://example.com",
					title: "Tab 1",
					faviconUrl: null,
					isPinned: false,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];

			const result = validateRelationships(workspaces, collections, tabs);

			expect(result.valid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it("should detect orphaned collections", () => {
			const workspaces: Workspace[] = [];
			const collections: Collection[] = [
				{
					id: "c1",
					workspaceId: "w1",
					userId: "user1",
					name: "Orphaned Collection",
					description: null,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];
			const tabs: TabItem[] = [];

			const result = validateRelationships(workspaces, collections, tabs);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should detect orphaned tabs", () => {
			const workspaces: Workspace[] = [];
			const collections: Collection[] = [];
			const tabs: TabItem[] = [
				{
					id: "t1",
					collectionId: "c1",
					userId: "user1",
					url: "https://example.com",
					title: "Orphaned Tab",
					faviconUrl: null,
					isPinned: false,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
					deletedAt: null,
				},
			];

			const result = validateRelationships(workspaces, collections, tabs);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});
	});
});
