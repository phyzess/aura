import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createTab,
	createTabs,
	getActiveTabs,
	getPinnedTabs,
	getTabsByCollection,
	markTabAsDeleted,
	reorderTab,
	sortTabsByOrder,
	toggleTabPin,
	updateTab,
} from "../../src/features/tab/domain";
import type { TabItem } from "../../src/types";

describe("Tab Operations", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
	});

	describe("createTab", () => {
		it("should create tab with required fields", () => {
			const tab = createTab({
				collectionId: "c1",
				url: "https://example.com",
				title: "Example",
				order: 0,
			});

			expect(tab.id).toBeDefined();
			expect(tab.collectionId).toBe("c1");
			expect(tab.url).toBe("https://example.com");
			expect(tab.title).toBe("Example");
			expect(tab.order).toBe(0);
			expect(tab.faviconUrl).toBe(
				"https://www.google.com/s2/favicons?domain=example.com&sz=64",
			);
			expect(tab.createdAt).toBe(Date.now());
			expect(tab.updatedAt).toBe(Date.now());
			expect(tab.deletedAt).toBeUndefined();
			expect(tab.isPinned).toBeUndefined();
		});

		it("should generate favicon URL from domain", () => {
			const tab = createTab({
				collectionId: "c1",
				url: "https://github.com/user/repo",
				title: "GitHub",
				order: 0,
			});

			expect(tab.faviconUrl).toBe(
				"https://www.google.com/s2/favicons?domain=github.com&sz=64",
			);
		});

		it("should generate unique IDs for different tabs", () => {
			const tab1 = createTab({
				collectionId: "c1",
				url: "https://example.com",
				title: "Tab 1",
				order: 0,
			});
			const tab2 = createTab({
				collectionId: "c1",
				url: "https://example.com",
				title: "Tab 2",
				order: 1,
			});

			expect(tab1.id).not.toBe(tab2.id);
		});
	});

	describe("createTabs", () => {
		it("should create multiple tabs with sequential order", () => {
			const tabs = createTabs({
				collectionId: "c1",
				tabs: [
					{ url: "https://example.com", title: "Example" },
					{ url: "https://github.com", title: "GitHub" },
				],
				startOrder: 0,
			});

			expect(tabs).toHaveLength(2);
			expect(tabs[0].order).toBe(0);
			expect(tabs[1].order).toBe(1);
		});

		it("should use same timestamp for all tabs", () => {
			const tabs = createTabs({
				collectionId: "c1",
				tabs: [
					{ url: "https://example.com", title: "Example" },
					{ url: "https://github.com", title: "GitHub" },
				],
				startOrder: 0,
			});

			expect(tabs[0].createdAt).toBe(tabs[1].createdAt);
			expect(tabs[0].updatedAt).toBe(tabs[1].updatedAt);
		});

		it("should start order from specified value", () => {
			const tabs = createTabs({
				collectionId: "c1",
				tabs: [
					{ url: "https://example.com", title: "Example" },
					{ url: "https://github.com", title: "GitHub" },
				],
				startOrder: 5,
			});

			expect(tabs[0].order).toBe(5);
			expect(tabs[1].order).toBe(6);
		});

		it("should handle empty tabs array", () => {
			const tabs = createTabs({
				collectionId: "c1",
				tabs: [],
				startOrder: 0,
			});

			expect(tabs).toEqual([]);
		});
	});

	describe("markTabAsDeleted", () => {
		it("should mark tab as deleted", () => {
			const tab: TabItem = {
				id: "t1",
				collectionId: "c1",
				url: "https://example.com",
				title: "Example",
				faviconUrl: null,
				isPinned: false,
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const deleted = markTabAsDeleted(tab);

			expect(deleted.deletedAt).toBe(Date.now());
			expect(deleted.updatedAt).toBe(Date.now());
		});

		it("should not modify original tab", () => {
			const tab: TabItem = {
				id: "t1",
				collectionId: "c1",
				url: "https://example.com",
				title: "Example",
				faviconUrl: null,
				isPinned: false,
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			markTabAsDeleted(tab);

			expect(tab.deletedAt).toBeUndefined();
		});
	});

	describe("toggleTabPin", () => {
		it("should pin unpinned tab", () => {
			const tab: TabItem = {
				id: "t1",
				collectionId: "c1",
				url: "https://example.com",
				title: "Example",
				faviconUrl: null,
				isPinned: false,
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const pinned = toggleTabPin(tab);

			expect(pinned.isPinned).toBe(true);
			expect(pinned.updatedAt).toBe(Date.now());
		});

		it("should unpin pinned tab", () => {
			const tab: TabItem = {
				id: "t1",
				collectionId: "c1",
				url: "https://example.com",
				title: "Example",
				faviconUrl: null,
				isPinned: true,
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const unpinned = toggleTabPin(tab);

			expect(unpinned.isPinned).toBe(false);
		});

		it("should not modify original tab", () => {
			const tab: TabItem = {
				id: "t1",
				collectionId: "c1",
				url: "https://example.com",
				title: "Example",
				faviconUrl: null,
				isPinned: false,
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			toggleTabPin(tab);

			expect(tab.isPinned).toBe(false);
		});
	});

	describe("updateTab", () => {
		it("should update tab title", () => {
			const tab: TabItem = {
				id: "t1",
				collectionId: "c1",
				url: "https://example.com",
				title: "Original",
				faviconUrl: null,
				isPinned: false,
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const updated = updateTab(tab, { title: "Updated" });

			expect(updated.title).toBe("Updated");
			expect(updated.updatedAt).toBe(Date.now());
		});

		it("should update multiple fields", () => {
			const tab: TabItem = {
				id: "t1",
				collectionId: "c1",
				url: "https://example.com",
				title: "Original",
				faviconUrl: null,
				isPinned: false,
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const updated = updateTab(tab, {
				title: "Updated",
				url: "https://new-url.com",
				isPinned: true,
			});

			expect(updated.title).toBe("Updated");
			expect(updated.url).toBe("https://new-url.com");
			expect(updated.isPinned).toBe(true);
		});

		it("should not modify original tab", () => {
			const tab: TabItem = {
				id: "t1",
				collectionId: "c1",
				url: "https://example.com",
				title: "Original",
				faviconUrl: null,
				isPinned: false,
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			updateTab(tab, { title: "Updated" });

			expect(tab.title).toBe("Original");
		});
	});

	describe("reorderTab", () => {
		it("should update tab order", () => {
			const tab: TabItem = {
				id: "t1",
				collectionId: "c1",
				url: "https://example.com",
				title: "Tab",
				faviconUrl: null,
				isPinned: false,
				order: 0,
				createdAt: 1000,
				updatedAt: 1000,
			};

			const reordered = reorderTab(tab, 5);

			expect(reordered.order).toBe(5);
			expect(reordered.updatedAt).toBe(Date.now());
		});
	});

	describe("getTabsByCollection", () => {
		it("should return only tabs for specified collection", () => {
			const tabs: TabItem[] = [
				{
					id: "t1",
					collectionId: "c1",
					url: "https://example.com",
					title: "Tab 1",
					faviconUrl: null,
					isPinned: false,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "t2",
					collectionId: "c2",
					url: "https://example.com",
					title: "Tab 2",
					faviconUrl: null,
					isPinned: false,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "t3",
					collectionId: "c1",
					url: "https://example.com",
					title: "Tab 3",
					faviconUrl: null,
					isPinned: false,
					order: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
			];

			const result = getTabsByCollection(tabs, "c1");

			expect(result).toHaveLength(2);
			expect(result.map((t) => t.id)).toEqual(["t1", "t3"]);
		});

		it("should exclude deleted tabs", () => {
			const tabs: TabItem[] = [
				{
					id: "t1",
					collectionId: "c1",
					url: "https://example.com",
					title: "Active",
					faviconUrl: null,
					isPinned: false,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "t2",
					collectionId: "c1",
					url: "https://example.com",
					title: "Deleted",
					faviconUrl: null,
					isPinned: false,
					order: 1,
					createdAt: 1000,
					updatedAt: 2000,
					deletedAt: 2000,
				},
			];

			const result = getTabsByCollection(tabs, "c1");

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("t1");
		});
	});

	describe("getActiveTabs", () => {
		it("should return only non-deleted tabs", () => {
			const tabs: TabItem[] = [
				{
					id: "t1",
					collectionId: "c1",
					url: "https://example.com",
					title: "Active",
					faviconUrl: null,
					isPinned: false,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "t2",
					collectionId: "c1",
					url: "https://example.com",
					title: "Deleted",
					faviconUrl: null,
					isPinned: false,
					order: 1,
					createdAt: 1000,
					updatedAt: 2000,
					deletedAt: 2000,
				},
			];

			const result = getActiveTabs(tabs);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("t1");
		});
	});

	describe("getPinnedTabs", () => {
		it("should return only pinned and non-deleted tabs", () => {
			const tabs: TabItem[] = [
				{
					id: "t1",
					collectionId: "c1",
					url: "https://example.com",
					title: "Pinned",
					faviconUrl: null,
					isPinned: true,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "t2",
					collectionId: "c1",
					url: "https://example.com",
					title: "Not Pinned",
					faviconUrl: null,
					isPinned: false,
					order: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "t3",
					collectionId: "c1",
					url: "https://example.com",
					title: "Pinned but Deleted",
					faviconUrl: null,
					isPinned: true,
					order: 2,
					createdAt: 1000,
					updatedAt: 2000,
					deletedAt: 2000,
				},
			];

			const result = getPinnedTabs(tabs);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("t1");
		});
	});

	describe("sortTabsByOrder", () => {
		it("should sort tabs by order ascending", () => {
			const tabs: TabItem[] = [
				{
					id: "t3",
					collectionId: "c1",
					url: "https://example.com",
					title: "Third",
					faviconUrl: null,
					isPinned: false,
					order: 2,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "t1",
					collectionId: "c1",
					url: "https://example.com",
					title: "First",
					faviconUrl: null,
					isPinned: false,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "t2",
					collectionId: "c1",
					url: "https://example.com",
					title: "Second",
					faviconUrl: null,
					isPinned: false,
					order: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
			];

			const sorted = sortTabsByOrder(tabs);

			expect(sorted.map((t) => t.id)).toEqual(["t1", "t2", "t3"]);
		});

		it("should not modify original array", () => {
			const tabs: TabItem[] = [
				{
					id: "t2",
					collectionId: "c1",
					url: "https://example.com",
					title: "Second",
					faviconUrl: null,
					isPinned: false,
					order: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: "t1",
					collectionId: "c1",
					url: "https://example.com",
					title: "First",
					faviconUrl: null,
					isPinned: false,
					order: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
			];

			sortTabsByOrder(tabs);

			expect(tabs[0].id).toBe("t2");
		});
	});
});
