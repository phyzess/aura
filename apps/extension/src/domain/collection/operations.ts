import type { Collection } from "@/types";

export const createCollection = (params: {
	workspaceId: string;
	name: string;
	description?: string;
	order: number;
}): Collection => ({
	id: crypto.randomUUID(),
	workspaceId: params.workspaceId,
	name: params.name,
	description: params.description,
	order: params.order,
	createdAt: Date.now(),
	updatedAt: Date.now(),
});

export const updateCollection = (
	collection: Collection,
	updates: Partial<Collection>,
): Collection => ({
	...collection,
	...updates,
	updatedAt: Date.now(),
});

export const markCollectionAsDeleted = (collection: Collection): Collection => {
	const now = Date.now();
	return {
		...collection,
		deletedAt: now,
		updatedAt: now,
	};
};

export const reorderCollection = (
	collection: Collection,
	newOrder: number,
): Collection => ({
	...collection,
	order: newOrder,
	updatedAt: Date.now(),
});

export const getCollectionsByWorkspace = (
	collections: Collection[],
	workspaceId: string,
): Collection[] =>
	collections.filter((c) => c.workspaceId === workspaceId && !c.deletedAt);

export const getActiveCollections = (collections: Collection[]): Collection[] =>
	collections.filter((c) => !c.deletedAt);

export const sortCollectionsByOrder = (
	collections: Collection[],
): Collection[] => [...collections].sort((a, b) => a.order - b.order);

