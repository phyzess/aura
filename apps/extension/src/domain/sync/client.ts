import type { Result } from "@aura/shared";
import { err, ok, tryCatchAsync } from "@aura/shared";
import type { SyncPayload } from "@/types";

export type SyncResult = "success" | "unauthorized" | "error";

export interface SyncContext {
	apiBaseUrl: string;
	currentUser: { id: string } | null;
}

export const pushToServer = async (
	context: SyncContext,
	payload: SyncPayload,
): Promise<Result<void, SyncResult>> => {
	if (!context.currentUser) {
		return err("unauthorized");
	}

	return tryCatchAsync(async () => {
		const response = await fetch(`${context.apiBaseUrl}/api/app/sync/push`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (response.status === 401) {
			throw "unauthorized";
		}

		if (!response.ok) {
			throw "error";
		}
	});
};

export const pullFromServer = async (
	context: SyncContext,
	lastSyncTimestamp: number,
): Promise<Result<SyncPayload | null, SyncResult>> => {
	if (!context.currentUser) {
		return err("unauthorized");
	}

	return tryCatchAsync(async () => {
		const response = await fetch(`${context.apiBaseUrl}/api/app/sync/pull`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ lastSyncTimestamp }),
		});

		if (response.status === 401) {
			throw "unauthorized";
		}

		if (!response.ok) {
			throw "error";
		}

		const data = (await response.json()) as SyncPayload;
		return data || null;
	});
};

export const createSyncPayload = (
	workspaces: any[],
	collections: any[],
	tabs: any[],
	lastSyncTimestamp: number,
): SyncPayload => ({
	workspaces,
	collections,
	tabs,
	lastSyncTimestamp,
});

export interface MergeStats {
	localWins: number;
	serverWins: number;
}

export const mergeWithTombstones = <
	T extends { id: string; updatedAt: number; deletedAt?: number },
>(
	local: T[],
	incoming: T[],
	stats?: MergeStats,
): T[] => {
	const byId = new Map<string, T>();

	for (const item of local) {
		byId.set(item.id, item);
	}

	for (const item of incoming) {
		const existing = byId.get(item.id);

		if (!existing) {
			byId.set(item.id, item);
		} else {
			const localTime = existing.deletedAt || existing.updatedAt;
			const incomingTime = item.deletedAt || item.updatedAt;

			if (incomingTime > localTime) {
				byId.set(item.id, item);
				if (stats) stats.serverWins++;
				console.log(
					`[sync] Resolved conflict for ${item.id}: incoming (${incomingTime}) > local (${localTime})`,
				);
			} else if (incomingTime < localTime) {
				if (stats) stats.localWins++;
				console.log(
					`[sync] Resolved conflict for ${item.id}: local (${localTime}) > incoming (${incomingTime})`,
				);
			}
		}
	}

	return Array.from(byId.values());
};

export const filterDeleted = <T extends { deletedAt?: number }>(
	items: T[],
): T[] => items.filter((item) => !item.deletedAt);

export const shouldResetDirtyFlag = (
	latestLocalChangeAt: number | null,
	lastSyncRunLocalChangeAt: number | null,
): boolean => {
	if (latestLocalChangeAt == null || lastSyncRunLocalChangeAt == null) {
		return false;
	}
	return latestLocalChangeAt <= lastSyncRunLocalChangeAt;
};

export const calculateRetryDelay = (
	currentDelay: number,
	initialDelay: number,
	maxDelay: number,
): number => {
	if (currentDelay > 0) {
		return Math.min(currentDelay * 2, maxDelay);
	}
	return initialDelay;
};
