import type { Collection, TabItem, Workspace } from "@/types";
import type { StateCommit } from "@/types/history";
import {
	clearAndBulkPut,
	clearStore,
	getAll,
	getMeta,
	put,
	putMeta,
	remove,
} from "./core";

export { initDB } from "./core";

export const LocalDB = {
	getWorkspaces: getAll<Workspace>("workspaces"),
	getCollections: getAll<Collection>("collections"),
	getTabs: getAll<TabItem>("tabs"),

	saveWorkspace: put<Workspace>("workspaces"),
	saveCollection: put<Collection>("collections"),
	saveTab: put<TabItem>("tabs"),

	deleteWorkspace: remove("workspaces"),
	deleteCollection: remove("collections"),
	deleteTab: remove("tabs"),

	saveAllWorkspaces: clearAndBulkPut<Workspace>("workspaces"),
	saveAllCollections: clearAndBulkPut<Collection>("collections"),
	saveAllTabs: clearAndBulkPut<TabItem>("tabs"),

	getLastSyncTimestamp: getMeta<number>("lastSyncTimestamp"),
	saveLastSyncTimestamp: (value: number) =>
		putMeta("lastSyncTimestamp", value)(),

	clearAll: async () => {
		await Promise.all([
			clearStore("workspaces")(),
			clearStore("collections")(),
			clearStore("tabs")(),
			clearStore("meta")(),
		]);
	},

	getCommits: getAll<StateCommit>("commits"),
	saveCommit: put<StateCommit>("commits"),
	deleteCommit: remove("commits"),
	clearCommits: clearStore("commits"),
};
