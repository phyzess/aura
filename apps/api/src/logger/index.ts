/**
 * Logger configuration for API (Cloudflare Workers)
 */

import { configure, getConsoleSink, getLogger } from "@aura/shared/logger";

/**
 * Initialize logger for API
 */
export async function initializeLogger(env?: string): Promise<void> {
	const isDev = env !== "production";

	await configure({
		sinks: {
			console: getConsoleSink(),
		},
		filters: {},
		loggers: [
			{
				category: ["api"],
				lowestLevel: isDev ? "debug" : "info",
				sinks: ["console"],
			},
			{
				category: ["api", "sync"],
				lowestLevel: isDev ? "debug" : "info",
				sinks: ["console"],
			},
			{
				category: ["api", "auth"],
				lowestLevel: isDev ? "debug" : "info",
				sinks: ["console"],
			},
			{
				category: ["api", "db"],
				lowestLevel: isDev ? "debug" : "warning",
				sinks: ["console"],
			},
			{
				category: ["api", "error"],
				lowestLevel: "error",
				sinks: ["console"],
			},
		],
	});
}

/**
 * Get logger for specific category
 */
export function getApiLogger(category: string[]) {
	return getLogger(["api", ...category]);
}

// Export commonly used loggers
export const syncLogger = getApiLogger(["sync"]);
export const authLogger = getApiLogger(["auth"]);
export const dbLogger = getApiLogger(["db"]);
export const errorLogger = getApiLogger(["error"]);
export const requestLogger = getApiLogger(["request"]);
