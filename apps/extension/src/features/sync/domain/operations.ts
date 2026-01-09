import type { MergeStats } from "@aura/domain";
import { filterDeleted, mergeWithTombstones } from "@aura/domain";
import type { Result } from "@aura/shared";
import { err, ok } from "@aura/shared";
import type { Collection, SyncPayload, TabItem, Workspace } from "@/types";

export interface SyncData {
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
	lastSyncTimestamp: number;
}

export interface MergeResult {
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
	stats: {
		workspace: MergeStats;
		collection: MergeStats;
		tab: MergeStats;
	};
}

export const mergeSyncData = (
	local: SyncData,
	incoming: SyncPayload,
): MergeResult => {
	const workspaceStats: MergeStats = { localWins: 0, serverWins: 0 };
	const collectionStats: MergeStats = { localWins: 0, serverWins: 0 };
	const tabStats: MergeStats = { localWins: 0, serverWins: 0 };

	const mergedWorkspaces = mergeWithTombstones(
		local.workspaces,
		incoming.workspaces,
		workspaceStats,
	);
	const mergedCollections = mergeWithTombstones(
		local.collections,
		incoming.collections,
		collectionStats,
	);
	const mergedTabs = mergeWithTombstones(local.tabs, incoming.tabs, tabStats);

	return {
		workspaces: mergedWorkspaces,
		collections: mergedCollections,
		tabs: mergedTabs,
		stats: {
			workspace: workspaceStats,
			collection: collectionStats,
			tab: tabStats,
		},
	};
};

export const getActiveData = (data: {
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
}): {
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
} => ({
	workspaces: filterDeleted(data.workspaces),
	collections: filterDeleted(data.collections),
	tabs: filterDeleted(data.tabs),
});

export const getTotalConflicts = (stats: {
	workspace: MergeStats;
	collection: MergeStats;
	tab: MergeStats;
}): number =>
	stats.workspace.localWins +
	stats.workspace.serverWins +
	stats.collection.localWins +
	stats.collection.serverWins +
	stats.tab.localWins +
	stats.tab.serverWins;

export const preparePushPayload = (
	data: SyncData,
): {
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
	lastSyncTimestamp: number;
} => ({
	workspaces: data.workspaces,
	collections: data.collections,
	tabs: data.tabs,
	lastSyncTimestamp: data.lastSyncTimestamp,
});

export const validateSyncPayload = (
	payload: unknown,
): Result<SyncPayload, string> => {
	if (!payload || typeof payload !== "object") {
		return err("Invalid payload");
	}

	const p = payload as any;

	if (!Array.isArray(p.workspaces)) {
		return err("Invalid workspaces");
	}

	if (!Array.isArray(p.collections)) {
		return err("Invalid collections");
	}

	if (!Array.isArray(p.tabs)) {
		return err("Invalid tabs");
	}

	if (typeof p.lastSyncTimestamp !== "number") {
		return err("Invalid lastSyncTimestamp");
	}

	return ok(p as SyncPayload);
};

export const shouldSync = (params: {
	isDirty: boolean;
	isOnline: boolean;
	isSyncing: boolean;
}): boolean => params.isDirty && params.isOnline && !params.isSyncing;

export const calculateNextSyncDelay = (params: {
	currentDelay: number;
	minDelay: number;
	maxDelay: number;
}): number => {
	const nextDelay =
		params.currentDelay === 0 ? params.minDelay : params.currentDelay * 2;
	return Math.min(nextDelay, params.maxDelay);
};
