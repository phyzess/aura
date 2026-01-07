export interface MergeStats {
	localWins: number;
	serverWins: number;
}

export interface Timestamped {
	id: string;
	updatedAt: number;
	deletedAt?: number;
}

export const mergeWithTombstones = <T extends Timestamped>(
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

export const filterDeleted = <T extends Timestamped>(items: T[]): T[] =>
	items.filter((item) => !item.deletedAt);

export const filterNotDeleted = filterDeleted;

export const getLatestTimestamp = <T extends Timestamped>(items: T[]): number => {
	let latest = 0;
	for (const item of items) {
		const time = item.deletedAt || item.updatedAt;
		if (time > latest) {
			latest = time;
		}
	}
	return latest;
};

export const hasConflicts = <T extends Timestamped>(
	local: T[],
	incoming: T[],
): boolean => {
	const localById = new Map(local.map((item) => [item.id, item]));

	for (const item of incoming) {
		const existing = localById.get(item.id);
		if (existing) {
			const localTime = existing.deletedAt || existing.updatedAt;
			const incomingTime = item.deletedAt || item.updatedAt;
			if (localTime !== incomingTime) {
				return true;
			}
		}
	}

	return false;
};

export const sortByOrder = <T extends { order: number }>(items: T[]): T[] =>
	[...items].sort((a, b) => a.order - b.order);

export const sortByUpdatedAt = <T extends { updatedAt: number }>(
	items: T[],
): T[] => [...items].sort((a, b) => b.updatedAt - a.updatedAt);

export const sortByCreatedAt = <T extends { createdAt: number }>(
	items: T[],
): T[] => [...items].sort((a, b) => b.createdAt - a.createdAt);

