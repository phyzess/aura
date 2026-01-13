import { API_BASE_URL } from "@/config/env";
import { getExtensionLogger } from "@/config/logger";
import type { CacheKey } from "./cache";
import { cacheService } from "./cache";

const logger = getExtensionLogger(["http-client"]);

interface HttpClientConfig {
	baseURL?: string;
	timeout?: number;
	retries?: number;
}

/**
 * HTTP client with request deduplication, caching, and convenience methods
 *
 * Features:
 * - Request deduplication: prevents duplicate concurrent requests
 * - Convenience methods: get, post, put, delete
 * - Cache integration: fetchWithCache for cached requests
 * - Configurable base URL
 *
 * Usage:
 * ```typescript
 * // Use apiClient for API requests (has baseURL configured)
 * const user = await apiClient.get('/api/user/me');
 *
 * // Use httpClient for other requests
 * const data = await httpClient.get('https://example.com/data');
 *
 * // With cache
 * const user = await apiClient.fetchWithCache('USER', 'current-user', '/api/user/me');
 * ```
 */
class HttpClient {
	private pending = new Map<string, Promise<Response>>();
	private config: HttpClientConfig;

	constructor(config: HttpClientConfig = {}) {
		this.config = config;
	}

	/**
	 * Core fetch method with request deduplication
	 * If the same request is already in progress, return the existing promise
	 */
	async fetch(url: string, options?: RequestInit): Promise<Response> {
		const fullUrl = this.resolveUrl(url);
		const key = this.getCacheKey(fullUrl, options);

		// Check if request is already in progress
		if (this.pending.has(key)) {
			logger.debug("Request deduplicated", {
				url: fullUrl,
				method: options?.method,
			});
			return this.pending.get(key)!;
		}

		// Create new request
		logger.debug("New request", { url: fullUrl, method: options?.method });
		const promise = fetch(fullUrl, options).finally(() => {
			// Remove from pending when complete
			this.pending.delete(key);
		});

		this.pending.set(key, promise);
		return promise;
	}

	/**
	 * GET request with automatic JSON parsing
	 */
	async get<T = any>(url: string, options?: RequestInit): Promise<T> {
		const res = await this.fetch(url, { ...options, method: "GET" });
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		}
		return res.json();
	}

	/**
	 * POST request with automatic JSON serialization and parsing
	 */
	async post<T = any>(
		url: string,
		data?: any,
		options?: RequestInit,
	): Promise<T> {
		const res = await this.fetch(url, {
			...options,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...options?.headers,
			},
			body: data !== undefined ? JSON.stringify(data) : undefined,
		});
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		}
		return res.json();
	}

	/**
	 * PUT request with automatic JSON serialization and parsing
	 */
	async put<T = any>(
		url: string,
		data?: any,
		options?: RequestInit,
	): Promise<T> {
		const res = await this.fetch(url, {
			...options,
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				...options?.headers,
			},
			body: data !== undefined ? JSON.stringify(data) : undefined,
		});
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		}
		return res.json();
	}

	/**
	 * DELETE request with automatic JSON parsing
	 */
	async delete<T = any>(url: string, options?: RequestInit): Promise<T> {
		const res = await this.fetch(url, { ...options, method: "DELETE" });
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		}
		return res.json();
	}

	/**
	 * Fetch with cache integration
	 * Checks cache first, then fetches and caches if not found
	 */
	async fetchWithCache<T = any>(
		cacheKey: CacheKey,
		dataKey: string,
		url: string,
		options?: RequestInit,
	): Promise<T> {
		// Try cache first
		const cached = await cacheService.get<T>(cacheKey, dataKey);
		if (cached) {
			logger.debug("Cache hit", { cacheKey, dataKey });
			return cached;
		}

		// Fetch and cache
		logger.debug("Cache miss, fetching", { cacheKey, dataKey, url });
		const res = await this.fetch(url, options);
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		}
		const data = await res.json();
		await cacheService.set(cacheKey, dataKey, data);
		return data;
	}

	/**
	 * Resolve URL with base URL if configured
	 */
	private resolveUrl(url: string): string {
		if (url.startsWith("http://") || url.startsWith("https://")) {
			return url;
		}
		return `${this.config.baseURL || ""}${url}`;
	}

	/**
	 * Generate cache key from URL and options
	 */
	private getCacheKey(url: string, options?: RequestInit): string {
		const method = options?.method || "GET";
		const body = options?.body ? JSON.stringify(options.body) : "";
		return `${method}:${url}:${body}`;
	}

	/**
	 * Clear all pending requests (useful for testing)
	 */
	clear(): void {
		this.pending.clear();
	}

	/**
	 * Get number of pending requests
	 */
	getPendingCount(): number {
		return this.pending.size;
	}
}

// Default HTTP client (no base URL)
export const httpClient = new HttpClient();

// API client with base URL configured
export const apiClient = new HttpClient({
	baseURL: API_BASE_URL,
});
