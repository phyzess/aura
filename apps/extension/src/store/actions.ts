import { API_ENDPOINTS } from "@aura/config";
import type { MergeStats } from "@aura/domain";
import { mergeWithTombstones } from "@aura/domain";
import { atom } from "jotai";
import { API_BASE_URL } from "@/config/env";
import type { CaptureSessionPayload } from "@/domain/import/session";
import type { ImportTobyPayload } from "@/domain/import/toby";
import type { SyncResult } from "@/domain/sync/client";
import { createAlert, sendAlerts, shouldSendAlert } from "@/services/alerts";
import { authClient } from "@/services/authClient";
import { initDB, LocalDB } from "@/services/db";
import {
	exportAllData,
	exportCollection,
	exportWorkspace,
} from "@/services/export";
import { linkCheckService } from "@/services/linkCheck";
import { notificationService } from "@/services/notifications";
import { offlineDetector } from "@/services/offline/detector";
import type {
	Collection,
	LinkStatus,
	SyncPayload,
	TabItem,
	User,
	Workspace,
} from "@/types";
import {
	activeWorkspaceIdAtom,
	authErrorAtom,
	authStatusAtom,
	collectionsAtom,
	currentUserAtom,
	isLoadingAtom,
	lastLocalChangeAtAtom,
	syncDirtyAtom,
	syncErrorAtom,
	syncLastSourceAtom,
	syncStatusAtom,
	tabsAtom,
	themeModeAtom,
	workspacesAtom,
} from "./atoms";

export type { CaptureSessionPayload, ImportTobyPayload };

const FAVICON_PATH = "/favicon.svg";

const updateFavicon = () => {
	const head = document.head;
	const oldLink = document.getElementById("favicon");

	if (oldLink) {
		head.removeChild(oldLink);
	}

	const newLink = document.createElement("link");
	newLink.id = "favicon";
	newLink.rel = "icon";
	newLink.type = "image/svg+xml";
	newLink.href = FAVICON_PATH;

	head.appendChild(newLink);
};

// Sync timing configuration - optimized for offline-first architecture
const AUTO_SYNC_DEBOUNCE_MS = 1000; // Reduced from 2000ms - faster initial sync
const AUTO_SYNC_MIN_INTERVAL_MS = 3000; // Reduced from 5000ms - more responsive
const AUTO_SYNC_INITIAL_RETRY_DELAY_MS = 5000; // Reduced from 10000ms - faster retry
const AUTO_SYNC_MAX_RETRY_DELAY_MS = 30000; // Reduced from 60000ms - don't wait too long
const AUTO_SYNC_BATCH_WINDOW_MS = 500; // New: batch multiple operations within this window

let autoSyncTimeout: ReturnType<typeof setTimeout> | null = null;
let lastAutoSyncAt = 0;
let autoSyncRetryDelayMs = 0;
let lastSyncRunLocalChangeAt: number | null = null;

// Batch operation tracking
let lastOperationAt = 0;
let pendingOperationsCount = 0;

// Sync queue to prevent concurrent syncs
const syncQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

const runSyncOnce = async (get: any, set: any): Promise<SyncResult> => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) {
		return "unauthorized";
	}

	await initDB();

	const [allWorkspaces, allCollections, allTabs] = await Promise.all([
		LocalDB.getWorkspaces(),
		LocalDB.getCollections(),
		LocalDB.getTabs(),
	]);

	const lastSync = (await LocalDB.getLastSyncTimestamp()) ?? 0;

	// Detect first sync: no local data and never synced before
	const isFirstSync =
		lastSync === 0 &&
		allWorkspaces.length === 0 &&
		allCollections.length === 0 &&
		allTabs.length === 0;

	if (isFirstSync) {
		console.log(
			"[sync] First sync detected - skipping push, will only pull from server",
		);
	} else {
		// Normal sync: push local changes to server first
		const payload: SyncPayload = {
			workspaces: allWorkspaces,
			collections: allCollections,
			tabs: allTabs,
			lastSyncTimestamp: lastSync,
		};

		let pushRes: Response;
		try {
			pushRes = await fetch(`${API_BASE_URL}/api/app/sync/push`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
		} catch (error) {
			console.error("[sync] push request failed", error);
			return "error";
		}

		if (pushRes.status === 401) {
			return "unauthorized";
		}
		if (!pushRes.ok) {
			console.error("[sync] push request not ok", pushRes.status);
			return "error";
		}
	}

	let pullRes: Response;
	try {
		pullRes = await fetch(`${API_BASE_URL}/api/app/sync/pull`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ lastSyncTimestamp: lastSync }),
		});
	} catch (error) {
		console.error("[sync] pull request failed", error);
		return "error";
	}

	if (pullRes.status === 401) {
		return "unauthorized";
	}
	if (!pullRes.ok) {
		console.error("[sync] pull request not ok", pullRes.status);
		return "error";
	}

	let pullPayload: SyncPayload | null = null;
	try {
		const rawPayload = await pullRes.json();
		console.log("[sync] raw pull payload", rawPayload);
		pullPayload = rawPayload as SyncPayload;
	} catch (error) {
		console.error("[sync] failed to parse pull payload", error);
		return "error";
	}

	if (!pullPayload) {
		console.log("[sync] pull payload is null, nothing to sync");
		return "success";
	}

	// Validate payload structure
	if (
		!Array.isArray(pullPayload.workspaces) ||
		!Array.isArray(pullPayload.collections) ||
		!Array.isArray(pullPayload.tabs)
	) {
		console.error("[sync] invalid pull payload structure", {
			workspaces: pullPayload.workspaces,
			collections: pullPayload.collections,
			tabs: pullPayload.tabs,
			workspacesType: typeof pullPayload.workspaces,
			collectionsType: typeof pullPayload.collections,
			tabsType: typeof pullPayload.tabs,
		});
		return "error";
	}

	console.log("[sync] pull payload validated", {
		workspacesCount: pullPayload.workspaces.length,
		collectionsCount: pullPayload.collections.length,
		tabsCount: pullPayload.tabs.length,
	});

	try {
		// Track merge conflicts
		const workspaceStats: MergeStats = { localWins: 0, serverWins: 0 };
		const collectionStats: MergeStats = { localWins: 0, serverWins: 0 };
		const tabStats: MergeStats = { localWins: 0, serverWins: 0 };

		const mergedWorkspaces = mergeWithTombstones<Workspace>(
			allWorkspaces,
			pullPayload.workspaces,
			workspaceStats,
		);
		const mergedCollections = mergeWithTombstones<Collection>(
			allCollections,
			pullPayload.collections,
			collectionStats,
		);
		const mergedTabs = mergeWithTombstones<TabItem>(
			allTabs,
			pullPayload.tabs,
			tabStats,
		);

		await Promise.all([
			LocalDB.saveAllWorkspaces(mergedWorkspaces),
			LocalDB.saveAllCollections(mergedCollections),
			LocalDB.saveAllTabs(mergedTabs),
			LocalDB.saveLastSyncTimestamp(pullPayload.lastSyncTimestamp),
		]);

		const activeWorkspaces = mergedWorkspaces.filter((w) => !w.deletedAt);
		const activeCollections = mergedCollections.filter((c) => !c.deletedAt);
		const activeTabs = mergedTabs.filter((t) => !t.deletedAt);

		set(workspacesAtom, activeWorkspaces);
		set(collectionsAtom, activeCollections);
		set(tabsAtom, activeTabs);

		const activeId = get(activeWorkspaceIdAtom);
		if (!activeId && activeWorkspaces.length > 0) {
			set(activeWorkspaceIdAtom, activeWorkspaces[0].id);
		} else if (
			activeId &&
			activeWorkspaces.every((workspace) => workspace.id !== activeId)
		) {
			set(
				activeWorkspaceIdAtom,
				activeWorkspaces.length > 0 ? activeWorkspaces[0].id : null,
			);
		}

		// Check for alert conditions
		const alerts = [];
		const totalConflicts =
			workspaceStats.localWins +
			workspaceStats.serverWins +
			collectionStats.localWins +
			collectionStats.serverWins +
			tabStats.localWins +
			tabStats.serverWins;

		// Alert 1: High conflict rate
		if (
			totalConflicts > 50 &&
			shouldSendAlert("high_conflict_rate", "warning")
		) {
			alerts.push(
				createAlert(
					"warning",
					"high_conflict_rate",
					`High conflict rate detected: ${totalConflicts} conflicts`,
					{
						workspaces: workspaceStats,
						collections: collectionStats,
						tabs: tabStats,
					},
				),
			);
		}

		// Alert 2: Clock skew detection (always losing)
		const totalServerWins =
			workspaceStats.serverWins +
			collectionStats.serverWins +
			tabStats.serverWins;
		const totalLocalWins =
			workspaceStats.localWins + collectionStats.localWins + tabStats.localWins;

		if (
			totalServerWins > 50 &&
			totalLocalWins === 0 &&
			shouldSendAlert("clock_skew", "error")
		) {
			alerts.push(
				createAlert(
					"error",
					"clock_skew",
					"Device clock may be incorrect - local changes always being overwritten",
					{
						serverWins: totalServerWins,
						localWins: totalLocalWins,
					},
				),
			);
		}

		// Send alerts if any
		if (alerts.length > 0) {
			sendAlerts(alerts, API_BASE_URL).catch((error) => {
				console.error("[sync] Failed to send alerts:", error);
			});
		}
	} catch (error) {
		console.error("[sync] failed to update local state", error);
		return "error";
	}

	return "success";
};

export const initThemeAtom = atom(null, (get) => {
	const theme = get(themeModeAtom);
	document.documentElement.classList.toggle("dark", theme === "dark");
	updateFavicon();
});

export const loadCurrentUserAtom = atom(null, async (_get, set) => {
	try {
		const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.ME}`, {
			method: "GET",
			credentials: "include",
		});

		if (!res.ok) {
			set(currentUserAtom, null);
			return;
		}

		const data = (await res.json()) as { user: User | null };
		set(currentUserAtom, data.user ?? null);
	} catch {
		set(currentUserAtom, null);
	}
});

export const toggleThemeAtom = atom(null, (get, set) => {
	const current = get(themeModeAtom);
	const next = current === "light" ? "dark" : "light";
	set(themeModeAtom, next);
	localStorage.setItem("aura-theme", next);
	document.documentElement.classList.toggle("dark", next === "dark");
	updateFavicon();
});

export const initDataAtom = atom(null, async (get, set) => {
	set(isLoadingAtom, true);
	await initDB();

	const [workspaces, collections, tabs] = await Promise.all([
		LocalDB.getWorkspaces(),
		LocalDB.getCollections(),
		LocalDB.getTabs(),
	]);

	const activeWorkspaces = workspaces.filter((w) => !w.deletedAt);
	const activeCollections = collections.filter((c) => !c.deletedAt);
	const activeTabs = tabs.filter((t) => !t.deletedAt);

	set(workspacesAtom, activeWorkspaces);
	set(collectionsAtom, activeCollections);
	set(tabsAtom, activeTabs);

	const activeId = get(activeWorkspaceIdAtom);
	if (!activeId && activeWorkspaces.length > 0) {
		set(activeWorkspaceIdAtom, activeWorkspaces[0].id);
	}

	set(isLoadingAtom, false);
});

export const createWorkspaceAtom = atom(
	null,
	async (get, set, name: string) => {
		const workspaces = get(workspacesAtom);
		const newWorkspace: Workspace = {
			id: crypto.randomUUID(),
			userId: null,
			name,
			description: null,
			order: workspaces.length,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			deletedAt: null,
		};

		await LocalDB.saveWorkspace(newWorkspace);
		set(workspacesAtom, [...workspaces, newWorkspace]);
		set(activeWorkspaceIdAtom, newWorkspace.id);
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);

		return newWorkspace;
	},
);

export const updateWorkspaceNameAtom = atom(
	null,
	async (get, set, args: { id: string; name: string }) => {
		const workspaces = get(workspacesAtom);
		const updated = workspaces.map((w) =>
			w.id === args.id ? { ...w, name: args.name, updatedAt: Date.now() } : w,
		);
		set(workspacesAtom, updated);

		const workspace = updated.find((w) => w.id === args.id);
		if (workspace) await LocalDB.saveWorkspace(workspace);
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);
	},
);

export const deleteWorkspaceAtom = atom(null, async (get, set, id: string) => {
	const workspaces = get(workspacesAtom);
	const collections = get(collectionsAtom);
	const tabs = get(tabsAtom);

	const workspace = workspaces.find((w) => w.id === id);
	const workspaceCollections = collections.filter((c) => c.workspaceId === id);
	const collectionIds = workspaceCollections.map((c) => c.id);
	const workspaceTabs = tabs.filter((t) =>
		collectionIds.includes(t.collectionId),
	);
	const now = Date.now();

	await Promise.all([
		workspace
			? LocalDB.saveWorkspace({
					...workspace,
					deletedAt: now,
					updatedAt: now,
				})
			: Promise.resolve(),
		...workspaceCollections.map((c) =>
			LocalDB.saveCollection({ ...c, deletedAt: now, updatedAt: now }),
		),
		...workspaceTabs.map((t) =>
			LocalDB.saveTab({ ...t, deletedAt: now, updatedAt: now }),
		),
	]);

	set(
		workspacesAtom,
		workspaces.filter((w) => w.id !== id),
	);
	set(
		collectionsAtom,
		collections.filter((c) => c.workspaceId !== id),
	);
	set(
		tabsAtom,
		tabs.filter((t) => !collectionIds.includes(t.collectionId)),
	);

	const activeId = get(activeWorkspaceIdAtom);
	if (activeId === id) {
		const remaining = workspaces.filter((w) => w.id !== id);
		set(activeWorkspaceIdAtom, remaining.length > 0 ? remaining[0].id : null);
	}
	set(syncDirtyAtom, true);
	set(lastLocalChangeAtAtom, Date.now());
	set(scheduleAutoSyncAtom);
});

export const reorderWorkspaceCollectionsAtom = atom(
	null,
	async (get, set, args: { workspaceId: string; orderedIds: string[] }) => {
		const collections = get(collectionsAtom);
		const workspaceCollections = collections.filter(
			(c) => c.workspaceId === args.workspaceId,
		);

		if (workspaceCollections.length === 0) return;

		const byId = new Map<string, Collection>();
		for (const c of workspaceCollections) {
			byId.set(c.id, c);
		}

		const now = Date.now();
		const reordered: Collection[] = [];

		for (let index = 0; index < args.orderedIds.length; index += 1) {
			const id = args.orderedIds[index];
			const existing = byId.get(id);
			if (!existing) continue;
			reordered.push({
				...existing,
				order: index,
				updatedAt: now,
			});
		}

		if (reordered.length === 0) return;

		const otherCollections = collections.filter(
			(c) => c.workspaceId !== args.workspaceId,
		);

		set(collectionsAtom, [...otherCollections, ...reordered]);

		await Promise.all(reordered.map((c) => LocalDB.saveCollection(c)));
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);
	},
);

export const addCollectionAtom = atom(
	null,
	async (get, set, args: { workspaceId: string; name: string }) => {
		const collections = get(collectionsAtom);
		const workspaceCollections = collections.filter(
			(c) => c.workspaceId === args.workspaceId,
		);

		const newCollection: Collection = {
			id: crypto.randomUUID(),
			workspaceId: args.workspaceId,
			userId: null,
			name: args.name,
			description: null,
			order: workspaceCollections.length,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			deletedAt: null,
		};

		await LocalDB.saveCollection(newCollection);
		set(collectionsAtom, [...collections, newCollection]);
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);

		return newCollection;
	},
);

export const updateCollectionNameAtom = atom(
	null,
	async (get, set, args: { id: string; name: string }) => {
		const collections = get(collectionsAtom);
		const updated = collections.map((c) =>
			c.id === args.id ? { ...c, name: args.name, updatedAt: Date.now() } : c,
		);
		set(collectionsAtom, updated);

		const collection = updated.find((c) => c.id === args.id);
		if (collection) await LocalDB.saveCollection(collection);
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);
	},
);

export const deleteCollectionAtom = atom(null, async (get, set, id: string) => {
	const collections = get(collectionsAtom);
	const tabs = get(tabsAtom);
	const collection = collections.find((c) => c.id === id);
	const collectionTabs = tabs.filter((t) => t.collectionId === id);
	const now = Date.now();

	await Promise.all([
		collection
			? LocalDB.saveCollection({
					...collection,
					deletedAt: now,
					updatedAt: now,
				})
			: Promise.resolve(),
		...collectionTabs.map((t) =>
			LocalDB.saveTab({ ...t, deletedAt: now, updatedAt: now }),
		),
	]);

	set(
		collectionsAtom,
		collections.filter((c) => c.id !== id),
	);
	set(
		tabsAtom,
		tabs.filter((t) => t.collectionId !== id),
	);
	set(syncDirtyAtom, true);
	set(lastLocalChangeAtAtom, Date.now());
	set(scheduleAutoSyncAtom);
});

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

		return newTab;
	},
);

/**
 * Batch add tabs to a collection without triggering sync for each tab
 * This is more efficient for importing multiple tabs at once
 */
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

		// Save all tabs to local DB
		await Promise.all(newTabs.map((tab) => LocalDB.saveTab(tab)));

		// Update state once
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

		// Create history commit (unless skipped)
		if (!args.skipHistory) {
			const { createCommitAtom } = await import("./history");
			await set(createCommitAtom, {
				message: `Move tab: ${tab.title}`,
				type: "UPDATE",
				entityType: "tab",
				entityId: tab.id,
				changes: { tabs: [tab] }, // Save old state
			});
		}
	},
);

export const syncWithServerAtom = atom(
	null,
	async (
		get,
		set,
		options?: {
			source?: "auto" | "manual";
			skipQueue?: boolean;
		},
	) => {
		// If already syncing and not skipping queue, add to queue
		if (get(syncStatusAtom) === "syncing" && !options?.skipQueue) {
			return new Promise<void>((resolve) => {
				syncQueue.push(async () => {
					await set(syncWithServerAtom, { ...options, skipQueue: true });
					resolve();
				});
			});
		}

		const source = options?.source ?? "manual";
		set(syncLastSourceAtom, source);
		set(syncStatusAtom, "syncing");
		set(syncErrorAtom, null);

		lastSyncRunLocalChangeAt = get(lastLocalChangeAtAtom) ?? null;

		let result: SyncResult;
		try {
			result = await runSyncOnce(get, set);
		} catch (error) {
			console.error("[sync] unexpected error", error);
			result = "error";
		}

		if (result === "success") {
			const latestLocalChangeAt = get(lastLocalChangeAtAtom);
			if (
				latestLocalChangeAt == null ||
				lastSyncRunLocalChangeAt == null ||
				latestLocalChangeAt <= lastSyncRunLocalChangeAt
			) {
				set(syncDirtyAtom, false);
			} else {
				set(syncDirtyAtom, true);
			}
			set(syncStatusAtom, "success");

			// Show notification for manual sync
			if (source === "manual") {
				await notificationService.success(
					"Sync Complete",
					"Your data has been synced successfully",
				);
			}
		} else if (result === "unauthorized") {
			set(syncStatusAtom, "error");
			set(syncErrorAtom, "Please sign in to sync.");

			if (source === "manual") {
				await notificationService.error(
					"Sync Failed",
					"Please sign in to sync your data",
				);
			}
		} else {
			set(syncStatusAtom, "error");
			set(syncErrorAtom, "Sync failed, please try again.");

			// Check if offline
			if (!offlineDetector.getStatus()) {
				set(
					syncErrorAtom,
					"You are offline. Changes will sync when you're back online.",
				);
			} else if (source === "manual") {
				await notificationService.error(
					"Sync Failed",
					"Please try again later",
				);
			}
		}

		if (typeof window !== "undefined") {
			setTimeout(() => {
				set(syncStatusAtom, "idle");
				set(syncErrorAtom, null);
				processNextInQueue(get, set);
			}, 1500);
		} else {
			set(syncStatusAtom, "idle");
			set(syncErrorAtom, null);
			processNextInQueue(get, set);
		}
	},
);

// Process next item in sync queue
const processNextInQueue = async (get: any, set: any) => {
	if (isProcessingQueue || syncQueue.length === 0) {
		return;
	}

	isProcessingQueue = true;
	const nextTask = syncQueue.shift();
	if (nextTask) {
		try {
			await nextTask();
		} catch (error) {
			console.error("[sync] queue task error", error);
		}
	}
	isProcessingQueue = false;

	// Continue processing if there are more items
	if (syncQueue.length > 0) {
		processNextInQueue(get, set);
	}
};

export const scheduleAutoSyncAtom = atom(null, (get, set) => {
	if (typeof window === "undefined") {
		return;
	}

	const currentUser = get(currentUserAtom);
	if (!currentUser) {
		return;
	}

	if (!get(syncDirtyAtom)) {
		return;
	}

	// Track operation for batching
	const now = Date.now();
	pendingOperationsCount++;
	lastOperationAt = now;

	const schedule = (delay: number) => {
		if (autoSyncTimeout) {
			clearTimeout(autoSyncTimeout);
		}

		autoSyncTimeout = window.setTimeout(() => {
			(async () => {
				autoSyncTimeout = null;

				const user = get(currentUserAtom);
				if (!user) {
					autoSyncRetryDelayMs = 0;
					pendingOperationsCount = 0;
					return;
				}

				if (!get(syncDirtyAtom)) {
					autoSyncRetryDelayMs = 0;
					pendingOperationsCount = 0;
					return;
				}

				// Check if we're still in batch window
				const timeSinceLastOp = Date.now() - lastOperationAt;
				if (
					timeSinceLastOp < AUTO_SYNC_BATCH_WINDOW_MS &&
					pendingOperationsCount > 0
				) {
					// Still receiving operations, wait a bit more
					schedule(AUTO_SYNC_BATCH_WINDOW_MS);
					return;
				}

				const sinceLast = Date.now() - lastAutoSyncAt;
				if (lastAutoSyncAt && sinceLast < AUTO_SYNC_MIN_INTERVAL_MS) {
					schedule(AUTO_SYNC_MIN_INTERVAL_MS - sinceLast);
					return;
				}

				if (get(syncStatusAtom) === "syncing") {
					schedule(AUTO_SYNC_DEBOUNCE_MS);
					return;
				}

				lastAutoSyncAt = Date.now();
				const opsCount = pendingOperationsCount;
				pendingOperationsCount = 0;

				console.log(`[sync] Syncing ${opsCount} pending operations`);

				await set(syncWithServerAtom, { source: "auto" });

				const status = get(syncStatusAtom);
				const stillDirty = get(syncDirtyAtom);

				if (status === "error" && stillDirty) {
					const nextDelay =
						autoSyncRetryDelayMs > 0
							? Math.min(autoSyncRetryDelayMs * 2, AUTO_SYNC_MAX_RETRY_DELAY_MS)
							: AUTO_SYNC_INITIAL_RETRY_DELAY_MS;
					autoSyncRetryDelayMs = nextDelay;
					schedule(nextDelay);
				} else if (stillDirty) {
					autoSyncRetryDelayMs = 0;
					schedule(AUTO_SYNC_DEBOUNCE_MS);
				} else {
					autoSyncRetryDelayMs = 0;
				}
			})();
		}, delay);
	};

	schedule(AUTO_SYNC_DEBOUNCE_MS);
});

export const signUpAtom = atom(
	null,
	async (
		_get,
		set,
		payload: { name: string; email: string; password: string },
	) => {
		const { error } = await authClient.signUp.email({
			name: payload.name,
			email: payload.email,
			password: payload.password,
		});

		if (error) {
			throw new Error(error.message || "Failed to sign up");
		}

		await set(loadCurrentUserAtom);
	},
);

export const signInAtom = atom(
	null,
	async (_get, set, payload: { email: string; password: string }) => {
		const { error } = await authClient.signIn.email({
			email: payload.email,
			password: payload.password,
		});

		if (error) {
			throw new Error(error.message || "Failed to sign in");
		}

		await set(loadCurrentUserAtom);
	},
);

export const signOutAtom = atom(null, async (get, set) => {
	set(authStatusAtom, "signingOut");
	set(authErrorAtom, null);

	try {
		await authClient.signOut();
		await set(loadCurrentUserAtom);

		const user = get(currentUserAtom);
		const ok = !user;
		if (!ok) {
			set(authErrorAtom, "Failed to sign out. Please try again.");
		}
		return ok;
	} catch (err) {
		console.error("Sign out failed", err);
		set(
			authErrorAtom,
			"Failed to sign out. Please check your connection and try again.",
		);
		return false;
	} finally {
		set(authStatusAtom, "idle");
	}
});

export const clearLocalDataAtom = atom(null, async (_get, set) => {
	set(workspacesAtom, []);
	set(collectionsAtom, []);
	set(tabsAtom, []);
	set(activeWorkspaceIdAtom, null);

	await LocalDB.clearAll();
});

export const captureSessionAtom = atom(
	null,
	async (_get, set, payload: CaptureSessionPayload) => {
		let workspaceId = payload.targetWorkspaceId;

		if (workspaceId === "new" && payload.newWorkspaceName) {
			const newWorkspace = await set(
				createWorkspaceAtom,
				payload.newWorkspaceName,
			);
			workspaceId = newWorkspace.id;
		}

		if (workspaceId === "new") return;

		let collectionId = payload.targetCollectionId;

		if (collectionId === "new" && payload.newCollectionName) {
			const newCollection = await set(addCollectionAtom, {
				workspaceId,
				name: payload.newCollectionName,
			});
			collectionId = newCollection.id;
		}

		if (collectionId === "new") return;

		// Collect all valid tabs
		const validTabs: Array<{ url: string; title: string }> = [];
		for (const tab of payload.tabs) {
			if (tab.url && tab.title) {
				validTabs.push({ url: tab.url, title: tab.title });
			}
		}

		// Batch add all tabs at once
		if (validTabs.length > 0) {
			await set(batchAddTabsAtom, {
				collectionId,
				tabs: validTabs,
			});
		}
	},
);

export const importTobyDataAtom = atom(
	null,
	async (_get, set, payload: ImportTobyPayload) => {
		let workspaceId = payload.targetWorkspaceId;

		if (workspaceId === "new" && payload.newWorkspaceName) {
			const newWorkspace = await set(
				createWorkspaceAtom,
				payload.newWorkspaceName,
			);
			workspaceId = newWorkspace.id;
		}

		if (workspaceId === "new") return;

		const tobyData = payload.data;
		if (!tobyData?.lists || !Array.isArray(tobyData.lists)) return;

		// Determine target collection behavior based on payload:
		// 1) Existing collection: append all imported tabs into that collection.
		// 2) New collection (with name provided): create exactly one collection
		//    and append all imported tabs into it.
		// 3) Fallback (no collection info): keep legacy behavior of creating
		//    one collection per list.
		let targetCollectionId: string | null = null;

		if (payload.targetCollectionId && payload.targetCollectionId !== "new") {
			targetCollectionId = payload.targetCollectionId;
		} else if (
			payload.targetCollectionId === "new" &&
			payload.newCollectionName
		) {
			const newCollection = await set(addCollectionAtom, {
				workspaceId,
				name: payload.newCollectionName,
			});
			targetCollectionId = newCollection.id;
		}

		if (targetCollectionId) {
			// Collect all tabs from all lists
			const allTabs: Array<{ url: string; title: string }> = [];
			for (const list of tobyData.lists) {
				if (!list.cards || !Array.isArray(list.cards)) continue;

				for (const card of list.cards) {
					if (card.url && card.title) {
						allTabs.push({ url: card.url, title: card.title });
					}
				}
			}

			// Batch add all tabs at once
			if (allTabs.length > 0) {
				await set(batchAddTabsAtom, {
					collectionId: targetCollectionId,
					tabs: allTabs,
				});
			}

			return;
		}

		// Create one collection per list
		for (const list of tobyData.lists) {
			if (!list.title || !list.cards || !Array.isArray(list.cards)) continue;

			const collection = await set(addCollectionAtom, {
				workspaceId,
				name: list.title,
			});

			// Collect tabs for this list
			const listTabs: Array<{ url: string; title: string }> = [];
			for (const card of list.cards) {
				if (card.url && card.title) {
					listTabs.push({ url: card.url, title: card.title });
				}
			}

			// Batch add tabs for this collection
			if (listTabs.length > 0) {
				await set(batchAddTabsAtom, {
					collectionId: collection.id,
					tabs: listTabs,
				});
			}
		}
	},
);

/**
 * Check link status for a single tab
 */
export const checkTabLinkAtom = atom(null, async (get, set, tabId: string) => {
	const tabs = get(tabsAtom);
	const tab = tabs.find((t) => t.id === tabId);
	if (!tab) return;

	// Set checking status
	const updatedTabs = tabs.map((t) =>
		t.id === tabId ? { ...t, linkStatus: "checking" as LinkStatus } : t,
	);
	set(tabsAtom, updatedTabs);

	// Check the link
	const status = await linkCheckService.checkUrl(tab.url);
	const now = Date.now();

	// Update tab with result
	const finalTabs = get(tabsAtom).map((t) =>
		t.id === tabId
			? { ...t, linkStatus: status, lastCheckedAt: now, updatedAt: now }
			: t,
	);
	set(tabsAtom, finalTabs);

	// Save to local DB
	const updatedTab = finalTabs.find((t) => t.id === tabId);
	if (updatedTab) {
		await LocalDB.saveTab(updatedTab);
	}

	set(syncDirtyAtom, true);
	set(lastLocalChangeAtAtom, Date.now());
	set(scheduleAutoSyncAtom);
});

/**
 * Check link status for multiple tabs with progress callback
 */
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
		const tabs = get(tabsAtom);
		const tabsToCheck = tabs.filter((t) => args.tabIds.includes(t.id));

		if (tabsToCheck.length === 0) {
			return { total: 0, valid: 0, broken: 0, uncertain: 0 };
		}

		// Set all to checking status
		const checkingTabs = tabs.map((t) =>
			args.tabIds.includes(t.id)
				? { ...t, linkStatus: "checking" as LinkStatus }
				: t,
		);
		set(tabsAtom, checkingTabs);

		// Check all links
		const urls = tabsToCheck.map((t) => t.url);
		const results = await linkCheckService.checkMultipleUrls(
			urls,
			(progress) => {
				args.onProgress?.(progress);
			},
		);

		const now = Date.now();

		// Update tabs with results
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

		// Save to local DB
		await Promise.all(
			updatedTabs
				.filter((t) => args.tabIds.includes(t.id))
				.map((t) => LocalDB.saveTab(t)),
		);

		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);

		// Calculate and return statistics
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

export const exportCollectionAtom = atom(
	null,
	(get, _set, collectionId: string) => {
		const collections = get(collectionsAtom);
		const tabs = get(tabsAtom);
		const currentUser = get(currentUserAtom);

		const collection = collections.find((c) => c.id === collectionId);
		if (!collection) {
			throw new Error("Collection not found");
		}

		exportCollection(collection, tabs, currentUser);
	},
);

export const exportWorkspaceAtom = atom(
	null,
	(get, _set, workspaceId: string) => {
		const workspaces = get(workspacesAtom);
		const collections = get(collectionsAtom);
		const tabs = get(tabsAtom);
		const currentUser = get(currentUserAtom);

		const workspace = workspaces.find((w) => w.id === workspaceId);
		if (!workspace) {
			throw new Error("Workspace not found");
		}

		exportWorkspace(workspace, collections, tabs, currentUser);
	},
);

export const exportAllDataAtom = atom(null, (get, _set) => {
	const workspaces = get(workspacesAtom);
	const collections = get(collectionsAtom);
	const tabs = get(tabsAtom);
	const currentUser = get(currentUserAtom);

	exportAllData(workspaces, collections, tabs, currentUser);
});
