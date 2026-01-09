/**
 * Logger types and utilities for LogTape integration
 */

export type { Logger, LogRecord, Sink } from "@logtape/logtape";

/**
 * Log level type
 */
export type LogLevel = "debug" | "info" | "warning" | "error" | "fatal";

/**
 * Stored log entry for IndexedDB
 */
export interface StoredLogEntry {
	id?: number;
	timestamp: number;
	level: string;
	category: readonly string[];
	message: readonly unknown[];
	properties?: Record<string, unknown>;
}

/**
 * Log export options
 */
export interface LogExportOptions {
	/** Filter by log level */
	level?: LogLevel;
	/** Filter logs since timestamp */
	since?: number;
	/** Filter logs until timestamp */
	until?: number;
	/** Maximum number of logs to export */
	limit?: number;
}

/**
 * Log statistics
 */
export interface LogStats {
	total: number;
	byLevel: Record<string, number>;
	oldestTimestamp?: number;
	newestTimestamp?: number;
	sizeInBytes?: number;
}
