import { atom } from "jotai";
import { currentUserAtom } from "@/features/auth/store/atoms";
import { collectionsAtom } from "@/features/collection/store/atoms";
import { tabsAtom } from "@/features/tab/store/atoms";
import { workspacesAtom } from "@/features/workspace/store/atoms";
import {
	exportAllData,
	exportCollection,
	exportWorkspace,
} from "@/services/export";

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
