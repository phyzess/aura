import type { LogRecord } from "@logtape/logtape";
import type { StoredLogEntry } from "./types";

/**
 * Convert LogTape LogRecord to StoredLogEntry for IndexedDB
 */
export function logRecordToStoredEntry(record: LogRecord): StoredLogEntry {
	return {
		timestamp: record.timestamp,
		level: record.level,
		category: record.category,
		message: record.message,
		properties: record.properties,
	};
}

/**
 * Format log record for display
 */
export function formatLogRecord(record: LogRecord): string {
	const timestamp = new Date(record.timestamp).toISOString();
	const level = record.level.toUpperCase().padEnd(7);
	const category = record.category.join(":");
	const message = record.message.join(" ");

	return `${timestamp} ${level} [${category}] ${message}`;
}

/**
 * Get log level priority (higher = more severe)
 */
export function getLogLevelPriority(level: string): number {
	const priorities: Record<string, number> = {
		debug: 0,
		info: 1,
		warning: 2,
		error: 3,
		fatal: 4,
	};
	return priorities[level.toLowerCase()] ?? 0;
}

/**
 * Filter log records by level
 */
export function filterByLevel(
	records: StoredLogEntry[],
	minLevel: string,
): StoredLogEntry[] {
	const minPriority = getLogLevelPriority(minLevel);
	return records.filter(
		(record) => getLogLevelPriority(record.level) >= minPriority,
	);
}

/**
 * Calculate approximate size of log entries in bytes
 */
export function calculateLogSize(entries: StoredLogEntry[]): number {
	return new Blob([JSON.stringify(entries)]).size;
}

