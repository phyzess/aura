import { atom } from "jotai";
import { collectionsAtom } from "@/features/collection/store/atoms";
import { scheduleAutoSyncAtom } from "@/features/sync/store/actions";
import {
	lastLocalChangeAtAtom,
	syncDirtyAtom,
} from "@/features/sync/store/atoms";
import { tabsAtom } from "@/features/tab/store/atoms";
import { LocalDB } from "@/services/db";
import type { Collection, Workspace } from "@/types";
import { activeWorkspaceIdAtom, workspacesAtom } from "./atoms";

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

		const { createCommitAtom } = await import("@/features/history/store");
		await set(createCommitAtom, {
			message: `Create workspace: ${newWorkspace.name}`,
			type: "CREATE",
			entityType: "workspace",
			entityId: newWorkspace.id,
			changes: { workspaces: [newWorkspace] },
		});

		return newWorkspace;
	},
);

export const updateWorkspaceNameAtom = atom(
	null,
	async (get, set, args: { id: string; name: string }) => {
		const workspaces = get(workspacesAtom);
		const oldWorkspace = workspaces.find((w) => w.id === args.id);
		const updated = workspaces.map((w) =>
			w.id === args.id ? { ...w, name: args.name, updatedAt: Date.now() } : w,
		);
		set(workspacesAtom, updated);

		const workspace = updated.find((w) => w.id === args.id);
		if (workspace) await LocalDB.saveWorkspace(workspace);
		set(syncDirtyAtom, true);
		set(lastLocalChangeAtAtom, Date.now());
		set(scheduleAutoSyncAtom);

		if (oldWorkspace && workspace) {
			const { createCommitAtom } = await import("@/features/history/store");
			await set(createCommitAtom, {
				message: `Rename workspace: ${oldWorkspace.name} → ${workspace.name}`,
				type: "UPDATE",
				entityType: "workspace",
				entityId: workspace.id,
				changes: { workspaces: [oldWorkspace] },
			});
		}
	},
);

export const renameWorkspaceAtom = updateWorkspaceNameAtom;

export const setActiveWorkspaceAtom = atom(
	null,
	(_get, set, workspaceId: string | null) => {
		set(activeWorkspaceIdAtom, workspaceId);
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

	if (workspace) {
		const { createCommitAtom } = await import("@/features/history/store");
		await set(createCommitAtom, {
			message: `Delete workspace: ${workspace.name}`,
			type: "DELETE",
			entityType: "workspace",
			entityId: workspace.id,
			changes: {
				workspaces: [workspace],
				collections: workspaceCollections,
				tabs: workspaceTabs,
			},
		});
	}
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
