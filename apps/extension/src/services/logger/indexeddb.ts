/**
 * IndexedDB sink for LogTape
 * Stores logs in IndexedDB with circular buffer (max 1000 entries)
 */

import type { LogRecord, Sink } from "@aura/shared/logger";
import {
	calculateLogSize,
	filterByLevel,
	type LogExportOptions,
	type LogStats,
	logRecordToStoredEntry,
	type StoredLogEntry,
} from "@aura/shared/logger";

const DB_NAME = "aura-logs";
const DB_VERSION = 1;
const STORE_NAME = "logs";
const MAX_LOGS = 1000;

/**
 * Open IndexedDB connection
 */
async function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, {
					keyPath: "id",
					autoIncrement: true,
				});
				store.createIndex("timestamp", "timestamp", { unique: false });
				store.createIndex("level", "level", { unique: false });
			}
		};
	});
}

/**
 * Save log entry to IndexedDB
 */
async function saveLog(entry: StoredLogEntry): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction([STORE_NAME], "readwrite");
	const store = transaction.objectStore(STORE_NAME);

	await new Promise<void>((resolve, reject) => {
		const request = store.add(entry);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});

	db.close();
}

/**
 * Trim old logs to maintain max size
 */
async function trimLogs(maxLogs: number): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction([STORE_NAME], "readwrite");
	const store = transaction.objectStore(STORE_NAME);

	const countRequest = store.count();
	const count = await new Promise<number>((resolve, reject) => {
		countRequest.onsuccess = () => resolve(countRequest.result);
		countRequest.onerror = () => reject(countRequest.error);
	});

	if (count > maxLogs) {
		const deleteCount = count - maxLogs;
		const cursorRequest = store.openCursor();

		let deleted = 0;
		await new Promise<void>((resolve, reject) => {
			cursorRequest.onsuccess = (event) => {
				const cursor = (event.target as IDBRequest).result;
				if (cursor && deleted < deleteCount) {
					cursor.delete();
					deleted++;
					cursor.continue();
				} else {
					resolve();
				}
			};
			cursorRequest.onerror = () => reject(cursorRequest.error);
		});
	}

	db.close();
}

/**
 * Create IndexedDB sink for LogTape
 */
export function getIndexedDBSink(maxLogs = MAX_LOGS): Sink {
	return async (record: LogRecord) => {
		try {
			const entry = logRecordToStoredEntry(record);
			await saveLog(entry);
			await trimLogs(maxLogs);
		} catch (error) {
			// Fallback to console if IndexedDB fails
			console.error("[IndexedDB Sink] Failed to save log:", error);
		}
	};
}

/**
 * Get all logs from IndexedDB
 */
export async function getAllLogs(): Promise<StoredLogEntry[]> {
	const db = await openDB();
	const transaction = db.transaction([STORE_NAME], "readonly");
	const store = transaction.objectStore(STORE_NAME);

	const logs = await new Promise<StoredLogEntry[]>((resolve, reject) => {
		const request = store.getAll();
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});

	db.close();
	return logs;
}

/**
 * Get logs with filters
 */
export async function getLogs(
	options: LogExportOptions = {},
): Promise<StoredLogEntry[]> {
	let logs = await getAllLogs();

	// Filter by level
	if (options.level) {
		logs = filterByLevel(logs, options.level);
	}

	// Filter by time range
	if (options.since) {
		logs = logs.filter((log) => log.timestamp >= (options.since ?? 0));
	}
	if (options.until) {
		logs = logs.filter(
			(log) => log.timestamp <= (options.until ?? Number.POSITIVE_INFINITY),
		);
	}

	// Apply limit
	if (options.limit) {
		logs = logs.slice(-options.limit);
	}

	return logs;
}

/**
 * Get log statistics
 */
export async function getLogStats(): Promise<LogStats> {
	const logs = await getAllLogs();

	const byLevel: Record<string, number> = {};
	let oldestTimestamp: number | undefined;
	let newestTimestamp: number | undefined;

	for (const log of logs) {
		byLevel[log.level] = (byLevel[log.level] || 0) + 1;

		if (!oldestTimestamp || log.timestamp < oldestTimestamp) {
			oldestTimestamp = log.timestamp;
		}
		if (!newestTimestamp || log.timestamp > newestTimestamp) {
			newestTimestamp = log.timestamp;
		}
	}

	return {
		total: logs.length,
		byLevel,
		oldestTimestamp,
		newestTimestamp,
		sizeInBytes: calculateLogSize(logs),
	};
}

/**
 * Clear all logs from IndexedDB
 */
export async function clearAllLogs(): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction([STORE_NAME], "readwrite");
	const store = transaction.objectStore(STORE_NAME);

	await new Promise<void>((resolve, reject) => {
		const request = store.clear();
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});

	db.close();
}
