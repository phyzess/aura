import type { Result } from "@aura/shared";
import { err, ok } from "@aura/shared";

const DB_NAME = "AuraDB";
const DB_VERSION = 3;

export type StoreName =
	| "workspaces"
	| "collections"
	| "tabs"
	| "meta"
	| "commits";

export const initDB = (): Promise<IDBDatabase> =>
	new Promise((resolve, reject) => {
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

export const getAll =
	<T>(storeName: StoreName) =>
	async (): Promise<Result<T[], Error>> => {
		try {
			const db = await initDB();
			const transaction = db.transaction(storeName, "readonly");
			const store = transaction.objectStore(storeName);

			return new Promise((resolve) => {
				const request = store.getAll();
				request.onerror = () =>
					resolve(
						err(new Error(request.error?.message || "Failed to get all")),
					);
				request.onsuccess = () => resolve(ok(request.result as T[]));
			});
		} catch (error) {
			return err(error as Error);
		}
	};

export const put =
	<T>(storeName: StoreName) =>
	async (data: T): Promise<Result<void, Error>> => {
		try {
			const db = await initDB();
			const transaction = db.transaction(storeName, "readwrite");
			const store = transaction.objectStore(storeName);

			return new Promise((resolve) => {
				const request = store.put(data);
				request.onerror = () =>
					resolve(err(new Error(request.error?.message || "Failed to put")));
				request.onsuccess = () => resolve(ok(undefined));
			});
		} catch (error) {
			return err(error as Error);
		}
	};

export const remove =
	(storeName: StoreName) =>
	async (id: string): Promise<Result<void, Error>> => {
		try {
			const db = await initDB();
			const transaction = db.transaction(storeName, "readwrite");
			const store = transaction.objectStore(storeName);

			return new Promise((resolve) => {
				const request = store.delete(id);
				request.onerror = () =>
					resolve(err(new Error(request.error?.message || "Failed to remove")));
				request.onsuccess = () => resolve(ok(undefined));
			});
		} catch (error) {
			return err(error as Error);
		}
	};

export const clearAndBulkPut =
	<T>(storeName: StoreName) =>
	async (data: T[]): Promise<Result<void, Error>> => {
		try {
			const db = await initDB();
			const transaction = db.transaction(storeName, "readwrite");
			const store = transaction.objectStore(storeName);

			store.clear();
			for (const item of data) {
				store.put(item);
			}

			return new Promise((resolve) => {
				transaction.oncomplete = () => resolve(ok(undefined));
				transaction.onerror = () =>
					resolve(
						err(new Error(transaction.error?.message || "Failed to bulk put")),
					);
				transaction.onabort = () =>
					resolve(err(new Error("Transaction aborted")));
			});
		} catch (error) {
			return err(error as Error);
		}
	};

export const clearStore =
	(storeName: StoreName) => async (): Promise<Result<void, Error>> => {
		try {
			const db = await initDB();
			const transaction = db.transaction(storeName, "readwrite");
			const store = transaction.objectStore(storeName);

			return new Promise((resolve) => {
				const request = store.clear();
				request.onerror = () =>
					resolve(err(new Error(request.error?.message || "Failed to clear")));
				request.onsuccess = () => resolve(ok(undefined));
			});
		} catch (error) {
			return err(error as Error);
		}
	};

export const getMeta =
	<T>(key: string) =>
	async (): Promise<Result<T | null, Error>> => {
		try {
			const db = await initDB();
			const transaction = db.transaction("meta", "readonly");
			const store = transaction.objectStore("meta");

			return new Promise((resolve) => {
				const request = store.get(key);
				request.onerror = () =>
					resolve(
						err(new Error(request.error?.message || "Failed to get meta")),
					);
				request.onsuccess = () => {
					const result = request.result;
					resolve(ok(result ? (result.value as T) : null));
				};
			});
		} catch (error) {
			return err(error as Error);
		}
	};

export const putMeta =
	<T>(key: string, value: T) =>
	async (): Promise<Result<void, Error>> => {
		try {
			const db = await initDB();
			const transaction = db.transaction("meta", "readwrite");
			const store = transaction.objectStore("meta");

			return new Promise((resolve) => {
				const request = store.put({ key, value });
				request.onerror = () =>
					resolve(
						err(new Error(request.error?.message || "Failed to put meta")),
					);
				request.onsuccess = () => resolve(ok(undefined));
			});
		} catch (error) {
			return err(error as Error);
		}
	};
