import type { Result } from "@aura/shared";
import { tryCatchAsync } from "@aura/shared";
import { LocalDB } from "@/services/db";
import type { Collection, TabItem, Workspace } from "@/types";

export const loadAllData = async (): Promise<
	Result<
		{
			workspaces: Workspace[];
			collections: Collection[];
			tabs: TabItem[];
			lastSyncTimestamp: number;
		},
		Error
	>
> =>
	tryCatchAsync(async () => {
		const [workspaces, collections, tabs, lastSyncTimestamp] =
			await Promise.all([
				LocalDB.getWorkspaces(),
				LocalDB.getCollections(),
				LocalDB.getTabs(),
				LocalDB.getLastSyncTimestamp(),
			]);

		return {
			workspaces,
			collections,
			tabs,
			lastSyncTimestamp: lastSyncTimestamp ?? 0,
		};
	});

export const saveAllData = async (data: {
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
	lastSyncTimestamp: number;
}): Promise<Result<void, Error>> =>
	tryCatchAsync(async () => {
		await Promise.all([
			LocalDB.saveAllWorkspaces(data.workspaces),
			LocalDB.saveAllCollections(data.collections),
			LocalDB.saveAllTabs(data.tabs),
			LocalDB.saveLastSyncTimestamp(data.lastSyncTimestamp),
		]);
	});

export const saveWorkspace = async (
	workspace: Workspace,
): Promise<Result<void, Error>> =>
	tryCatchAsync(async () => {
		await LocalDB.saveWorkspace(workspace);
	});

export const saveCollection = async (
	collection: Collection,
): Promise<Result<void, Error>> =>
	tryCatchAsync(async () => {
		await LocalDB.saveCollection(collection);
	});

export const saveTab = async (tab: TabItem): Promise<Result<void, Error>> =>
	tryCatchAsync(async () => {
		await LocalDB.saveTab(tab);
	});

export const saveTabs = async (tabs: TabItem[]): Promise<Result<void, Error>> =>
	tryCatchAsync(async () => {
		await Promise.all(tabs.map((tab) => LocalDB.saveTab(tab)));
	});

export const clearAllData = async (): Promise<Result<void, Error>> =>
	tryCatchAsync(async () => {
		await LocalDB.clearAll();
	});
