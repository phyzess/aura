import type { MergeStats } from "@aura/domain";
import { mergeWithTombstones } from "@aura/domain";
import { atom } from "jotai";
import { API_BASE_URL } from "@/config/env";
import { currentUserAtom } from "@/features/auth/store/atoms";
import { collectionsAtom } from "@/features/collection/store/atoms";
import type { SyncResult } from "@/features/sync/domain";
import { tabsAtom } from "@/features/tab/store/atoms";
import {
	activeWorkspaceIdAtom,
	workspacesAtom,
} from "@/features/workspace/store/atoms";
import { createAlert, sendAlerts, shouldSendAlert } from "@/services/alerts";
import { initDB, LocalDB } from "@/services/db";
import { notificationService } from "@/services/notifications";
import { offlineDetector } from "@/services/offline/detector";
import type { Collection, SyncPayload, TabItem, Workspace } from "@/types";
import {
	lastLocalChangeAtAtom,
	syncDirtyAtom,
	syncErrorAtom,
	syncLastSourceAtom,
	syncStatusAtom,
} from "./atoms";

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
