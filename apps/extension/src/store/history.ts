import { atom } from "jotai";
import { LocalDB } from "@/services/db";
import type { Collection, TabItem, Workspace } from "@/types";
import type { StateCommit } from "@/types/history";
import {
	collectionsAtom,
	currentUserAtom,
	tabsAtom,
	workspacesAtom,
} from "./atoms";

export const historyCommitsAtom = atom<Map<string, StateCommit>>(new Map());
export const historyHeadAtom = atom<string | null>(null);
// Map from parent hash to child hash for O(1) redo lookup
export const historyChildrenAtom = atom<Map<string | null, string>>(new Map());

export const canUndoAtom = atom((get) => {
	const head = get(historyHeadAtom);
	if (!head) return false;

	const commits = get(historyCommitsAtom);
	const currentCommit = commits.get(head);
	return !!currentCommit?.parentHash;
});

export const canRedoAtom = atom((get) => {
	const head = get(historyHeadAtom);
	const children = get(historyChildrenAtom);

	return !!children.get(head);
});

export async function generateCommitHash(
	parentHash: string | null,
	timestamp: number,
	changes: any,
): Promise<string> {
	const content = JSON.stringify({ parentHash, timestamp, changes });
	const encoder = new TextEncoder();
	const data = encoder.encode(content);

	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return hashHex.slice(0, 8);
}

const MAX_HISTORY_COMMITS = 100;

export const createCommitAtom = atom(
	null,
	async (
		get,
		set,
		params: {
			message: string;
			type: StateCommit["type"];
			entityType: StateCommit["entityType"];
			entityId: string;
			changes: StateCommit["changes"];
		},
	) => {
		const parentHash = get(historyHeadAtom);
		const timestamp = Date.now();
		const user = get(currentUserAtom);

		const hash = await generateCommitHash(
			parentHash,
			timestamp,
			params.changes,
		);

		const commit: StateCommit = {
			hash,
			parentHash,
			timestamp,
			author: user?.id || "anonymous",
			message: params.message,
			type: params.type,
			entityType: params.entityType,
			entityId: params.entityId,
			changes: params.changes,
		};

		const commits = new Map(get(historyCommitsAtom));
		commits.set(hash, commit);

		// Update children map for O(1) redo lookup
		const children = new Map(get(historyChildrenAtom));
		children.set(parentHash, hash);

		// Auto-cleanup: keep only the most recent MAX_HISTORY_COMMITS
		if (commits.size > MAX_HISTORY_COMMITS) {
			const sortedCommits = Array.from(commits.values()).sort(
				(a, b) => b.timestamp - a.timestamp,
			);
			const toKeep = new Set(
				sortedCommits.slice(0, MAX_HISTORY_COMMITS).map((c) => c.hash),
			);
			const toDelete: string[] = [];

			for (const [hash] of commits) {
				if (!toKeep.has(hash)) {
					toDelete.push(hash);
					commits.delete(hash);
				}
			}

			// Clean up children map
			for (const [parentHash, childHash] of children) {
				if (!commits.has(childHash)) {
					children.delete(parentHash);
				}
			}

			// Delete from IndexedDB
			await Promise.all(toDelete.map((hash) => LocalDB.deleteCommit(hash)));
		}

		set(historyCommitsAtom, commits);
		set(historyChildrenAtom, children);
		set(historyHeadAtom, hash);

		await LocalDB.saveCommit(commit);

		return commit;
	},
);

async function applyCommitReverse(
	get: any,
	set: any,
	commit: StateCommit,
): Promise<void> {
	const { type, changes, entityType } = commit;

	if (entityType === "tab" && changes.tabs) {
		const tab = changes.tabs[0];

		if (type === "DELETE") {
			await LocalDB.saveTab({ ...tab, deletedAt: null });
			set(tabsAtom, [...get(tabsAtom), tab]);
		} else if (type === "CREATE") {
			const now = Date.now();
			await LocalDB.saveTab({ ...tab, deletedAt: now, updatedAt: now });
			set(
				tabsAtom,
				get(tabsAtom).filter((t: TabItem) => t.id !== tab.id),
			);
		} else if (type === "MOVE" || type === "UPDATE") {
			// For MOVE and UPDATE, restore the previous state
			await LocalDB.saveTab(tab);
			set(
				tabsAtom,
				get(tabsAtom).map((t: TabItem) => (t.id === tab.id ? tab : t)),
			);
		}
	}

	if (entityType === "collection" && changes.collections) {
		const collection = changes.collections[0];

		if (type === "DELETE") {
			await LocalDB.saveCollection({ ...collection, deletedAt: null });
			set(collectionsAtom, [...get(collectionsAtom), collection]);

			// Restore deleted tabs
			if (changes.tabs) {
				for (const tab of changes.tabs) {
					await LocalDB.saveTab({ ...tab, deletedAt: null });
				}
				set(tabsAtom, [...get(tabsAtom), ...changes.tabs]);
			}
		} else if (type === "CREATE") {
			const now = Date.now();
			await LocalDB.saveCollection({
				...collection,
				deletedAt: now,
				updatedAt: now,
			});
			set(
				collectionsAtom,
				get(collectionsAtom).filter((c: Collection) => c.id !== collection.id),
			);
		} else if (type === "UPDATE") {
			// Restore previous collection state
			await LocalDB.saveCollection(collection);
			set(
				collectionsAtom,
				get(collectionsAtom).map((c: Collection) =>
					c.id === collection.id ? collection : c,
				),
			);
		}
	}

	if (entityType === "workspace" && changes.workspaces) {
		const workspace = changes.workspaces[0];

		if (type === "DELETE") {
			await LocalDB.saveWorkspace({ ...workspace, deletedAt: null });
			set(workspacesAtom, [...get(workspacesAtom), workspace]);

			// Restore deleted collections
			if (changes.collections) {
				for (const collection of changes.collections) {
					await LocalDB.saveCollection({ ...collection, deletedAt: null });
				}
				set(collectionsAtom, [...get(collectionsAtom), ...changes.collections]);
			}

			// Restore deleted tabs
			if (changes.tabs) {
				for (const tab of changes.tabs) {
					await LocalDB.saveTab({ ...tab, deletedAt: null });
				}
				set(tabsAtom, [...get(tabsAtom), ...changes.tabs]);
			}
		} else if (type === "CREATE") {
			const now = Date.now();
			await LocalDB.saveWorkspace({
				...workspace,
				deletedAt: now,
				updatedAt: now,
			});
			set(
				workspacesAtom,
				get(workspacesAtom).filter((w: Workspace) => w.id !== workspace.id),
			);
		} else if (type === "UPDATE") {
			// Restore previous workspace state
			await LocalDB.saveWorkspace(workspace);
			set(
				workspacesAtom,
				get(workspacesAtom).map((w: Workspace) =>
					w.id === workspace.id ? workspace : w,
				),
			);
		}
	}
}

export const checkoutCommitAtom = atom(
	null,
	async (get, set, targetHash: string) => {
		const commits = get(historyCommitsAtom);
		const currentHead = get(historyHeadAtom);

		if (!currentHead) return;

		const path: StateCommit[] = [];
		let hash: string | null = currentHead;

		while (hash && hash !== targetHash) {
			const commit = commits.get(hash);
			if (!commit) break;
			path.push(commit);
			hash = commit.parentHash;
		}

		if (hash !== targetHash) {
			throw new Error("Target commit not found in history");
		}

		for (const commit of path) {
			await applyCommitReverse(get, set, commit);
		}

		set(historyHeadAtom, targetHash);
	},
);

export const undoAtom = atom(null, async (get, set) => {
	const head = get(historyHeadAtom);
	if (!head) return null;

	const commits = get(historyCommitsAtom);
	const currentCommit = commits.get(head);
	if (!currentCommit?.parentHash) return null;

	await set(checkoutCommitAtom, currentCommit.parentHash);

	return currentCommit;
});

export const redoAtom = atom(null, async (get, set) => {
	const head = get(historyHeadAtom);
	const children = get(historyChildrenAtom);
	const commits = get(historyCommitsAtom);

	const childHash = children.get(head);
	if (!childHash) return null;

	const childCommit = commits.get(childHash);
	if (!childCommit) return null;

	await set(checkoutCommitAtom, childCommit.hash);

	return childCommit;
});

export const initHistoryAtom = atom(null, async (_get, set) => {
	const commits = await LocalDB.getCommits();
	const commitsMap = new Map<string, StateCommit>();
	const childrenMap = new Map<string | null, string>();

	for (const commit of commits) {
		commitsMap.set(commit.hash, commit);
		// Build children map
		childrenMap.set(commit.parentHash, commit.hash);
	}

	set(historyCommitsAtom, commitsMap);
	set(historyChildrenAtom, childrenMap);

	if (commits.length > 0) {
		const latestCommit = commits.reduce((latest, current) =>
			current.timestamp > latest.timestamp ? current : latest,
		);
		set(historyHeadAtom, latestCommit.hash);
	}
});
