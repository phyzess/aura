import type { Collection, TabItem, Workspace } from "@/types";
import type { StateCommit } from "@/types/history";

const DB_NAME = "AuraDB";
const DB_VERSION = 3;

export const initDB = (): Promise<IDBDatabase> => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			if (!db.objectStoreNames.contains("workspaces")) {
				db.createObjectStore("workspaces", { keyPath: "id" });
			}
			if (!db.objectStoreNames.contains("collections")) {
				db.createObjectStore("collections", { keyPath: "id" });
			}
			if (!db.objectStoreNames.contains("tabs")) {
				db.createObjectStore("tabs", { keyPath: "id" });
			}
			if (!db.objectStoreNames.contains("meta")) {
				db.createObjectStore("meta", { keyPath: "key" });
			}
			if (!db.objectStoreNames.contains("commits")) {
				const commitStore = db.createObjectStore("commits", {
					keyPath: "hash",
				});
				commitStore.createIndex("timestamp", "timestamp", { unique: false });
				commitStore.createIndex("entityType", "entityType", { unique: false });
				commitStore.createIndex("entityId", "entityId", { unique: false });
			}
		};
	});
};

const getAll = <T>(storeName: string): Promise<T[]> => {
	return new Promise((resolve, reject) => {
		initDB()
			.then((db) => {
				const transaction = db.transaction(storeName, "readonly");
				const store = transaction.objectStore(storeName);
				const request = store.getAll();

				request.onerror = () => reject(request.error);
				request.onsuccess = () => resolve(request.result);
			})
			.catch(reject);
	});
};

const put = <T>(storeName: string, data: T): Promise<void> => {
	return new Promise((resolve, reject) => {
		initDB()
			.then((db) => {
				const transaction = db.transaction(storeName, "readwrite");
				const store = transaction.objectStore(storeName);
				const request = store.put(data);

				request.onerror = () => reject(request.error);
				request.onsuccess = () => resolve();
			})
			.catch(reject);
	});
};

const remove = (storeName: string, id: string): Promise<void> => {
	return initDB().then((db) => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(storeName, "readwrite");
			const store = transaction.objectStore(storeName);
			const request = store.delete(id);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	});
};

const clearAndBulkPut = <T>(storeName: string, data: T[]): Promise<void> => {
	return new Promise((resolve, reject) => {
		initDB()
			.then((db) => {
				const transaction = db.transaction(storeName, "readwrite");
				const store = transaction.objectStore(storeName);
				store.clear();
				for (const item of data) {
					store.put(item as unknown as T);
				}
				transaction.oncomplete = () => resolve();
				transaction.onerror = () => reject(transaction.error);
				transaction.onabort = () => reject(transaction.error);
			})
			.catch(reject);
	});
};

const clearStore = (storeName: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		initDB()
			.then((db) => {
				const transaction = db.transaction(storeName, "readwrite");
				const store = transaction.objectStore(storeName);
				const request = store.clear();

				request.onerror = () => reject(request.error);
				request.onsuccess = () => resolve();
			})
			.catch(reject);
	});
};

const getMeta = <T>(key: string): Promise<T | null> => {
	return new Promise((resolve, reject) => {
		initDB()
			.then((db) => {
				const transaction = db.transaction("meta", "readonly");
				const store = transaction.objectStore("meta");
				const request = store.get(key);

				request.onerror = () => reject(request.error);
				request.onsuccess = () => {
					const result = request.result as
						| { key: string; value: T }
						| undefined;
					resolve(result ? result.value : null);
				};
			})
			.catch(reject);
	});
};

const putMeta = <T>(key: string, value: T): Promise<void> => {
	return new Promise((resolve, reject) => {
		initDB()
			.then((db) => {
				const transaction = db.transaction("meta", "readwrite");
				const store = transaction.objectStore("meta");
				const request = store.put({ key, value });

				request.onerror = () => reject(request.error);
				request.onsuccess = () => resolve();
			})
			.catch(reject);
	});
};

export const LocalDB = {
	getWorkspaces: () => getAll<Workspace>("workspaces"),
	getCollections: () => getAll<Collection>("collections"),
	getTabs: () => getAll<TabItem>("tabs"),

	saveWorkspace: (workspace: Workspace) => put("workspaces", workspace),
	saveCollection: (collection: Collection) => put("collections", collection),
	saveTab: (tab: TabItem) => put("tabs", tab),

	deleteWorkspace: (id: string) => remove("workspaces", id),
	deleteCollection: (id: string) => remove("collections", id),
	deleteTab: (id: string) => remove("tabs", id),

	saveAllWorkspaces: (workspaces: Workspace[]) =>
		clearAndBulkPut<Workspace>("workspaces", workspaces),
	saveAllCollections: (collections: Collection[]) =>
		clearAndBulkPut<Collection>("collections", collections),
	saveAllTabs: (tabs: TabItem[]) => clearAndBulkPut<TabItem>("tabs", tabs),

	getLastSyncTimestamp: () => getMeta<number>("lastSyncTimestamp"),
	saveLastSyncTimestamp: (value: number) =>
		putMeta<number>("lastSyncTimestamp", value),
	clearAll: () =>
		Promise.all([
			clearStore("workspaces"),
			clearStore("collections"),
			clearStore("tabs"),
			clearStore("meta"),
		]).then(() => undefined),

	getCommits: () => getAll<StateCommit>("commits"),
	getCommit: (hash: string) =>
		new Promise<StateCommit | null>((resolve, reject) => {
			initDB()
				.then((db) => {
					const transaction = db.transaction("commits", "readonly");
					const store = transaction.objectStore("commits");
					const request = store.get(hash);

					request.onerror = () => reject(request.error);
					request.onsuccess = () => resolve(request.result || null);
				})
				.catch(reject);
		}),
	saveCommit: (commit: StateCommit) => put("commits", commit),
	deleteCommit: (hash: string) => remove("commits", hash),
	clearCommits: () => clearStore("commits"),
};
