import type { Collection, TabItem, Workspace } from "./index";

export type CommitType = "CREATE" | "UPDATE" | "DELETE" | "MOVE";
export type EntityType = "workspace" | "collection" | "tab";

export interface StateCommit {
	hash: string;
	parentHash: string | null;
	timestamp: number;
	author: string;
	message: string;

	type: CommitType;
	entityType: EntityType;
	entityId: string;

	changes: {
		workspaces?: Workspace[];
		collections?: Collection[];
		tabs?: TabItem[];
	};
}

export interface HistoryState {
	commits: Map<string, StateCommit>;
	head: string | null;
}

