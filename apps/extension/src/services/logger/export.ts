/**
 * Log export functionality
 */

import type { LogExportOptions } from "@aura/shared/logger";
import { getLogs } from "./indexeddb";

/**
 * Export logs to JSON file
 */
export async function exportLogs(
	options: LogExportOptions = {},
): Promise<void> {
	const logs = await getLogs(options);

	const exportData = {
		exportedAt: new Date().toISOString(),
		version: chrome.runtime.getManifest().version,
		environment: import.meta.env.MODE || "production",
		filters: options,
		totalLogs: logs.length,
		logs,
	};

	const blob = new Blob([JSON.stringify(exportData, null, 2)], {
		type: "application/json",
	});

	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `aura-logs-${Date.now()}.json`;
	a.click();

	// Clean up
	setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Format log size in human-readable format
 */
export function formatLogSize(bytes: number): string {
	if (bytes === 0) return "0 B";

	const units = ["B", "KB", "MB", "GB"];
	const k = 1024;
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${(bytes / k ** i).toFixed(2)} ${units[i]}`;
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: number): string {
	return new Date(timestamp).toLocaleString();
}
