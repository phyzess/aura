/**
 * Hono middleware for request logging
 */

import type { Context, Next } from "hono";
import { requestLogger } from "./index";

/**
 * Log HTTP requests
 */
export async function loggerMiddleware(c: Context, next: Next): Promise<void> {
	const start = Date.now();
	const { method, url } = c.req;

	await next();

	const duration = Date.now() - start;
	const status = c.res.status;

	// Log based on status code
	if (status >= 500) {
		requestLogger.error(`${method} ${url}`, {
			status,
			duration,
		});
	} else if (status >= 400) {
		requestLogger.warning(`${method} ${url}`, {
			status,
			duration,
		});
	} else {
		requestLogger.info(`${method} ${url}`, {
			status,
			duration,
		});
	}
}
