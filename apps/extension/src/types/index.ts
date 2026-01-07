import type {
	Collection,
	TabItem as DomainTabItem,
	SyncPayload,
	User,
	Workspace,
} from "@aura/domain";

export type { User, Workspace, Collection, SyncPayload };
export type { StateCommit } from "./history";

export type LinkStatus =
	| "valid"
	| "broken"
	| "uncertain"
	| "checking"
	| "unchecked";

export interface TabItem extends DomainTabItem {
	linkStatus?: LinkStatus;
	lastCheckedAt?: number;
}

export interface SessionTab extends Partial<TabItem> {
	chromeTabId?: number;
}

export interface AppState {
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
	activeWorkspaceId: string | null;
	isLoading: boolean;
	currentUser: User | null;
}

export type Action =
	| { type: "SET_LOADING"; payload: boolean }
	| {
			type: "LOAD_DATA";
			payload: {
				workspaces: Workspace[];
				collections: Collection[];
				tabs: TabItem[];
			};
	  }
	| { type: "ADD_WORKSPACE"; payload: Workspace }
	| { type: "ADD_COLLECTION"; payload: Collection }
	| { type: "ADD_TAB"; payload: TabItem }
	| { type: "DELETE_TAB"; payload: string }
	| { type: "SET_ACTIVE_WORKSPACE"; payload: string }
	| { type: "SET_USER"; payload: User | null };
