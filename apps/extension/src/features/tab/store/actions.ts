import { atom } from "jotai";
import { scheduleAutoSyncAtom } from "@/features/sync/store/actions";
import {
	lastLocalChangeAtAtom,
	syncDirtyAtom,
} from "@/features/sync/store/atoms";
import { LocalDB } from "@/services/db";
import type { TabItem } from "@/types";
import { tabsAtom } from "./atoms";

export const addTabAtom = atom(
	null,
	async (
		get,
		set,
		args: { collectionId: string; url: string; title: string },
	) => {
		const tabs = get(tabsAtom);
		const collectionTabs = tabs.filter(
			(t) => t.collectionId === args.collectionId,
		);

		const newTab: TabItem = {
			id: crypto.randomUUID(),
			collectionId: args.collectionId,
			userId: null,
			url: args.url,
			title: args.title,
			faviconUrl: `https://www.google.com/s2/favicons?domain=${new URL(args.url).hostname}&sz=64`,
			isPinned: false,
			order: collectionTabs.length,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			deletedAt: null,
		};

		await LocalDB.saveTab(newTab);
		set(tabsAtom, [...tabs, newTab]);
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);

		const { createCommitAtom } = await import("@/features/history/store");
		await set(createCommitAtom, {
			message: `Create tab: ${newTab.title}`,
			type: "CREATE",
			entityType: "tab",
			entityId: newTab.id,
			changes: { tabs: [newTab] },
		});

		return newTab;
	},
);

export const batchAddTabsAtom = atom(
	null,
	async (
		get,
		set,
		args: {
			collectionId: string;
			tabs: Array<{ url: string; title: string }>;
		},
	) => {
		const existingTabs = get(tabsAtom);
		const collectionTabs = existingTabs.filter(
			(t) => t.collectionId === args.collectionId,
		);

		const now = Date.now();
		const newTabs: TabItem[] = args.tabs.map((tab, index) => ({
			id: crypto.randomUUID(),
			collectionId: args.collectionId,
			userId: null,
			url: tab.url,
			title: tab.title,
			faviconUrl: `https://www.google.com/s2/favicons?domain=${new URL(tab.url).hostname}&sz=64`,
			isPinned: false,
			order: collectionTabs.length + index,
			createdAt: now,
			updatedAt: now,
			deletedAt: null,
		}));

		await Promise.all(newTabs.map((tab) => LocalDB.saveTab(tab)));

		set(tabsAtom, [...existingTabs, ...newTabs]);
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);

		return newTabs;
	},
);

export const deleteTabAtom = atom(null, async (get, set, id: string) => {
	const tabs = get(tabsAtom);
	const tab = tabs.find((t) => t.id === id);
	const now = Date.now();

	if (tab) {
		await LocalDB.saveTab({ ...tab, deletedAt: now, updatedAt: now });

		const { createCommitAtom } = await import("@/features/history/store");
		await set(createCommitAtom, {
			message: `Delete tab: ${tab.title}`,
			type: "DELETE",
			entityType: "tab",
			entityId: tab.id,
			changes: { tabs: [tab] },
		});
	}
	set(
		tabsAtom,
		tabs.filter((t) => t.id !== id),
	);
	set(syncDirtyAtom, true);
	set(lastLocalChangeAtAtom, Date.now());
	set(scheduleAutoSyncAtom);
});

export const toggleTabPinAtom = atom(null, async (get, set, id: string) => {
	const tabs = get(tabsAtom);
	const tab = tabs.find((t) => t.id === id);

	if (!tab) return;

	const updated: TabItem = {
		...tab,
		isPinned: !tab.isPinned,
		updatedAt: Date.now(),
	};

	await LocalDB.saveTab(updated);

	set(
		tabsAtom,
		tabs.map((t) => (t.id === id ? updated : t)),
	);
	set(syncDirtyAtom, true);
	set(lastLocalChangeAtAtom, Date.now());
	set(scheduleAutoSyncAtom);
});

export const updateTabAtom = atom(
	null,
	async (get, set, args: { id: string; title?: string; url?: string }) => {
		const tabs = get(tabsAtom);
		const tab = tabs.find((t) => t.id === args.id);

		if (!tab) return;

		const updated: TabItem = {
			...tab,
			...(args.title !== undefined && { title: args.title }),
			...(args.url !== undefined && { url: args.url }),
			updatedAt: Date.now(),
		};

		await LocalDB.saveTab(updated);

		set(
			tabsAtom,
			tabs.map((t) => (t.id === args.id ? updated : t)),
		);
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);

		const { createCommitAtom } = await import("@/features/history/store");
		await set(createCommitAtom, {
			message: `Update tab: ${updated.title}`,
			type: "UPDATE",
			entityType: "tab",
			entityId: updated.id,
			changes: { tabs: [tab] },
		});
	},
);

export const moveTabAtom = atom(
	null,
	async (
		get,
		set,
		args: {
			tabId: string;
			targetCollectionId: string;
			targetIndex: number;
			shouldPin?: boolean;
			skipHistory?: boolean;
		},
	) => {
		const tabs = get(tabsAtom);
		const tab = tabs.find((t) => t.id === args.tabId);

		if (!tab) return;

		const sourceCollectionId = tab.collectionId;
		const now = Date.now();

		const targetTabs = tabs
			.filter(
				(t) => t.collectionId === args.targetCollectionId && t.id !== tab.id,
			)
			.sort((a, b) => a.order - b.order);

		const clampedIndex = Math.max(
			0,
			Math.min(args.targetIndex, targetTabs.length),
		);

		const shouldUpdatePin = args.shouldPin !== undefined;
		const newPinState =
			shouldUpdatePin && args.shouldPin !== undefined
				? args.shouldPin
				: tab.isPinned;

		const movedTab: TabItem = {
			...tab,
			collectionId: args.targetCollectionId,
			order: clampedIndex,
			isPinned: newPinState,
			updatedAt: now,
		};

		const newTargetTabs: TabItem[] = [
			...targetTabs.slice(0, clampedIndex),
			movedTab,
			...targetTabs.slice(clampedIndex),
		];

		const normalizedTargetTabs = newTargetTabs.map((t, index) => ({
			...t,
			order: index,
			updatedAt: t.id === movedTab.id ? now : t.updatedAt,
		}));

		let normalizedSourceTabs: TabItem[] = [];
		if (sourceCollectionId !== args.targetCollectionId) {
			const sourceTabs = tabs
				.filter((t) => t.collectionId === sourceCollectionId && t.id !== tab.id)
				.sort((a, b) => a.order - b.order);

			normalizedSourceTabs = sourceTabs.map((t, index) => ({
				...t,
				order: index,
				updatedAt: now,
			}));
		}

		const keptTabs = tabs.filter((t) => {
			if (t.collectionId === args.targetCollectionId) return false;
			if (t.collectionId === sourceCollectionId) return false;
			return true;
		});

		const finalTabs =
			sourceCollectionId === args.targetCollectionId
				? [...keptTabs, ...normalizedTargetTabs]
				: [...keptTabs, ...normalizedTargetTabs, ...normalizedSourceTabs];

		set(tabsAtom, finalTabs);

		const tabsToPersist =
			sourceCollectionId === args.targetCollectionId
				? normalizedTargetTabs
				: [...normalizedTargetTabs, ...normalizedSourceTabs];

		await Promise.all(tabsToPersist.map((t) => LocalDB.saveTab(t)));
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);

		if (!args.skipHistory) {
			const { createCommitAtom } = await import("@/features/history/store");
			await set(createCommitAtom, {
				message: `Move tab: ${tab.title}`,
				type: "MOVE",
				entityType: "tab",
				entityId: tab.id,
				changes: { tabs: [tab] },
			});
		}
	},
);

export const reorderTabsAtom = atom(
	null,
	async (get, set, args: { collectionId: string; tabIds: string[] }) => {
		const tabs = get(tabsAtom);
		const now = Date.now();

		const updated = tabs.map((t) => {
			if (t.collectionId !== args.collectionId) return t;
			const newOrder = args.tabIds.indexOf(t.id);
			if (newOrder === -1) return t;
			return { ...t, order: newOrder, updatedAt: now };
		});

		await Promise.all(
			updated
				.filter((t) => t.collectionId === args.collectionId)
				.map((t) => LocalDB.saveTab(t)),
		);

		set(tabsAtom, updated);
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);
	},
);

export const openTabAtom = atom(null, async (_get, _set, url: string) => {
	if (typeof chrome !== "undefined" && chrome.tabs) {
		await chrome.tabs.create({ url });
	} else {
		window.open(url, "_blank");
	}
});

export const openTabsAtom = atom(null, async (_get, _set, urls: string[]) => {
	if (typeof chrome !== "undefined" && chrome.tabs) {
		for (const url of urls) {
			await chrome.tabs.create({ url });
		}
	} else {
		for (const url of urls) {
			window.open(url, "_blank");
		}
	}
});

export const checkTabLinkAtom = atom(null, async (get, set, tabId: string) => {
	const { linkCheckService } = await import("@/services/linkCheck");
	const tabs = get(tabsAtom);
	const tab = tabs.find((t) => t.id === tabId);
	if (!tab) return;

	const updatedTabs = tabs.map((t) =>
		t.id === tabId ? { ...t, linkStatus: "checking" as const } : t,
	);
	set(tabsAtom, updatedTabs);

	const status = await linkCheckService.checkUrl(tab.url);
	const now = Date.now();

	const finalTabs = get(tabsAtom).map((t) =>
		t.id === tabId
			? { ...t, linkStatus: status, lastCheckedAt: now, updatedAt: now }
			: t,
	);
	set(tabsAtom, finalTabs);

	const updatedTab = finalTabs.find((t) => t.id === tabId);
	if (updatedTab) {
		await LocalDB.saveTab(updatedTab);
	}

	set(syncDirtyAtom, true);
	set(lastLocalChangeAtAtom, Date.now());
	set(scheduleAutoSyncAtom);
});

export const checkMultipleLinksAtom = atom(
	null,
	async (
		get,
		set,
		args: {
			tabIds: string[];
			onProgress?: (progress: { total: number; checked: number }) => void;
		},
	) => {
		const { linkCheckService } = await import("@/services/linkCheck");
		const tabs = get(tabsAtom);
		const tabsToCheck = tabs.filter((t) => args.tabIds.includes(t.id));

		if (tabsToCheck.length === 0) {
			return { total: 0, valid: 0, broken: 0, uncertain: 0 };
		}

		const checkingTabs = tabs.map((t) =>
			args.tabIds.includes(t.id)
				? { ...t, linkStatus: "checking" as const }
				: t,
		);
		set(tabsAtom, checkingTabs);

		const urls = tabsToCheck.map((t) => t.url);
		const results = await linkCheckService.checkMultipleUrls(
			urls,
			(progress) => {
				args.onProgress?.(progress);
			},
		);

		const now = Date.now();

		const updatedTabs = get(tabsAtom).map((t) => {
			if (!args.tabIds.includes(t.id)) return t;
			const status = results.get(t.url);
			if (!status) return t;
			return {
				...t,
				linkStatus: status,
				lastCheckedAt: now,
				updatedAt: now,
			};
		});

		set(tabsAtom, updatedTabs);

		await Promise.all(
			updatedTabs
				.filter((t) => args.tabIds.includes(t.id))
				.map((t) => LocalDB.saveTab(t)),
		);

		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);

		const checkedTabs = updatedTabs.filter((t) => args.tabIds.includes(t.id));
		const stats = {
			total: checkedTabs.length,
			valid: checkedTabs.filter((t) => t.linkStatus === "valid").length,
			broken: checkedTabs.filter((t) => t.linkStatus === "broken").length,
			uncertain: checkedTabs.filter((t) => t.linkStatus === "uncertain").length,
		};

		return stats;
	},
);
