/**
 * Logger configuration for Extension
 */

import { configure, getConsoleSink, getLogger } from "@aura/shared/logger";
import { getIndexedDBSink } from "@/services/logger";

/**
 * Initialize logger for Extension
 */
export async function initializeLogger(): Promise<void> {
	const isDev = import.meta.env.DEV;

	await configure({
		sinks: {
			console: getConsoleSink(),
			storage: getIndexedDBSink(1000),
		},
		filters: {},
		loggers: [
			{
				category: ["extension"],
				lowestLevel: isDev ? "debug" : "info",
				sinks: ["console", "storage"],
			},
			{
				category: ["extension", "sync"],
				lowestLevel: isDev ? "debug" : "info",
				sinks: ["console", "storage"],
			},
			{
				category: ["extension", "auth"],
				lowestLevel: isDev ? "debug" : "info",
				sinks: ["console", "storage"],
			},
			{
				category: ["extension", "storage"],
				lowestLevel: isDev ? "debug" : "warning",
				sinks: ["console", "storage"],
			},
			{
				category: ["extension", "error"],
				lowestLevel: "error",
				sinks: ["console", "storage"],
			},
		],
	});
}

/**
 * Get logger for specific category
 */
export function getExtensionLogger(category: string[]) {
	return getLogger(["extension", ...category]);
}

// Export commonly used loggers
export const syncLogger = getExtensionLogger(["sync"]);
export const authLogger = getExtensionLogger(["auth"]);
export const storageLogger = getExtensionLogger(["storage"]);
export const errorLogger = getExtensionLogger(["error"]);
export const uiLogger = getExtensionLogger(["ui"]);
export const workspaceLogger = getExtensionLogger(["workspace"]);
export const historyLogger = getExtensionLogger(["history"]);
export const collectionLogger = getExtensionLogger(["collection"]);
export const tabLogger = getExtensionLogger(["tab"]);
export const importLogger = getExtensionLogger(["import"]);
