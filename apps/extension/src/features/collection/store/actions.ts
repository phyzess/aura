import { atom } from "jotai";
import { scheduleAutoSyncAtom } from "@/features/sync/store/actions";
import {
	lastLocalChangeAtAtom,
	syncDirtyAtom,
} from "@/features/sync/store/atoms";
import { tabsAtom } from "@/features/tab/store/atoms";
import { LocalDB } from "@/services/db";
import type { Collection } from "@/types";
import { collectionsAtom } from "./atoms";

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

		const { createCommitAtom } = await import("@/features/history/store");
		await set(createCommitAtom, {
			message: `Create collection: ${newCollection.name}`,
			type: "CREATE",
			entityType: "collection",
			entityId: newCollection.id,
			changes: { collections: [newCollection] },
		});

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

	if (collection) {
		const { createCommitAtom } = await import("@/features/history/store");
		await set(createCommitAtom, {
			message: `Delete collection: ${collection.name}`,
			type: "DELETE",
			entityType: "collection",
			entityId: collection.id,
			changes: { collections: [collection], tabs: collectionTabs },
		});
	}
});

export const renameCollectionAtom = atom(
	null,
	async (get, set, args: { id: string; name: string }) => {
		const collections = get(collectionsAtom);
		const collection = collections.find((c) => c.id === args.id);

		if (!collection) return;

		const updated = {
			...collection,
			name: args.name,
			updatedAt: Date.now(),
		};

		await LocalDB.saveCollection(updated);

		set(
			collectionsAtom,
			collections.map((c) => (c.id === args.id ? updated : c)),
		);
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);

		const { createCommitAtom } = await import("@/features/history/store");
		await set(createCommitAtom, {
			message: `Rename collection: ${collection.name} → ${updated.name}`,
			type: "UPDATE",
			entityType: "collection",
			entityId: updated.id,
			changes: { collections: [collection] },
		});
	},
);

export const reorderCollectionsAtom = atom(
	null,
	async (get, set, args: { workspaceId: string; collectionIds: string[] }) => {
		const collections = get(collectionsAtom);
		const now = Date.now();

		const updated = collections.map((c) => {
			if (c.workspaceId !== args.workspaceId) return c;
			const newOrder = args.collectionIds.indexOf(c.id);
			if (newOrder === -1) return c;
			return { ...c, order: newOrder, updatedAt: now };
		});

		await Promise.all(
			updated
				.filter((c) => c.workspaceId === args.workspaceId)
				.map((c) => LocalDB.saveCollection(c)),
		);

		set(collectionsAtom, updated);
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);
	},
);

export const moveCollectionAtom = atom(
	null,
	async (get, set, args: { id: string; targetWorkspaceId: string }) => {
		const collections = get(collectionsAtom);
		const tabs = get(tabsAtom);
		const collection = collections.find((c) => c.id === args.id);

		if (!collection) return;

		const now = Date.now();

		const updatedCollection = {
			...collection,
			workspaceId: args.targetWorkspaceId,
			updatedAt: now,
		};

		const updatedTabs = tabs
			.filter((t) => t.collectionId === args.id)
			.map((t) => ({ ...t, updatedAt: now }));

		await Promise.all([
			LocalDB.saveCollection(updatedCollection),
			...updatedTabs.map((t) => LocalDB.saveTab(t)),
		]);

		set(
			collectionsAtom,
			collections.map((c) => (c.id === args.id ? updatedCollection : c)),
		);
		set(
			tabsAtom,
			tabs.map((t) => {
				const updated = updatedTabs.find((ut) => ut.id === t.id);
				return updated || t;
			}),
		);
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);

		const { createCommitAtom } = await import("@/features/history/store");
		await set(createCommitAtom, {
			message: `Move collection: ${collection.name}`,
			type: "UPDATE",
			entityType: "collection",
			entityId: collection.id,
			changes: { collections: [collection] },
		});
	},
);

export const duplicateCollectionAtom = atom(
	null,
	async (get, set, id: string) => {
		const collections = get(collectionsAtom);
		const tabs = get(tabsAtom);
		const collection = collections.find((c) => c.id === id);

		if (!collection) return;

		const now = Date.now();
		const newCollectionId = crypto.randomUUID();

		const newCollection = {
			...collection,
			id: newCollectionId,
			name: `${collection.name} (Copy)`,
			createdAt: now,
			updatedAt: now,
		};

		const collectionTabs = tabs.filter((t) => t.collectionId === id);
		const newTabs = collectionTabs.map((t, index) => ({
			...t,
			id: crypto.randomUUID(),
			collectionId: newCollectionId,
			order: index,
			createdAt: now,
			updatedAt: now,
		}));

		await Promise.all([
			LocalDB.saveCollection(newCollection),
			...newTabs.map((t) => LocalDB.saveTab(t)),
		]);

		set(collectionsAtom, [...collections, newCollection]);
		set(tabsAtom, [...tabs, ...newTabs]);
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);

		return newCollection;
	},
);
