import { atom } from "jotai";
import { addCollectionAtom } from "@/features/collection/store/actions";
import type {
	CaptureSessionPayload,
	ImportTobyPayload,
} from "@/features/import/domain";
import { batchAddTabsAtom } from "@/features/tab/store/actions";
import { createWorkspaceAtom } from "@/features/workspace/store/actions";

export type { CaptureSessionPayload, ImportTobyPayload };

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

		const validTabs: Array<{ url: string; title: string }> = [];
		for (const tab of payload.tabs) {
			if (tab.url && tab.title) {
				validTabs.push({ url: tab.url, title: tab.title });
			}
		}

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
			const allTabs: Array<{ url: string; title: string }> = [];
			for (const list of tobyData.lists) {
				if (!list.cards || !Array.isArray(list.cards)) continue;

				for (const card of list.cards) {
					if (card.url && card.title) {
						allTabs.push({ url: card.url, title: card.title });
					}
				}
			}

			if (allTabs.length > 0) {
				await set(batchAddTabsAtom, {
					collectionId: targetCollectionId,
					tabs: allTabs,
				});
			}

			return;
		}

		for (const list of tobyData.lists) {
			if (!list.title || !list.cards || !Array.isArray(list.cards)) continue;

			const collection = await set(addCollectionAtom, {
				workspaceId,
				name: list.title,
			});

			const listTabs: Array<{ url: string; title: string }> = [];
			for (const card of list.cards) {
				if (card.url && card.title) {
					listTabs.push({ url: card.url, title: card.title });
				}
			}

			if (listTabs.length > 0) {
				await set(batchAddTabsAtom, {
					collectionId: collection.id,
					tabs: listTabs,
				});
			}
		}
	},
);
