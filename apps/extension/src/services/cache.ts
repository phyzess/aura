import { CACHE_DURATIONS } from "@aura/config";
import { getExtensionLogger } from "@/config/logger";

const logger = getExtensionLogger(["cache"]);

interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

export type CacheKey = keyof typeof CACHE_DURATIONS;

/**
 * Unified cache service using chrome.storage.local
 *
 * Usage:
 * ```typescript
 * // Get cached data
 * const user = await cacheService.get('USER', 'current-user');
 *
 * // Set cache
 * await cacheService.set('USER', 'current-user', userData);
 *
 * // Clear cache
 * await cacheService.clear('USER', 'current-user');
 * ```
 */
class CacheService {
	private readonly PREFIX = "aura-cache:";

	/**
	 * Generate storage key
	 */
	private getStorageKey(cacheKey: CacheKey, dataKey: string): string {
		return `${this.PREFIX}${cacheKey}:${dataKey}`;
	}

	/**
	 * Get cached data if not expired
	 */
	async get<T>(cacheKey: CacheKey, dataKey: string): Promise<T | null> {
		const storageKey = this.getStorageKey(cacheKey, dataKey);
		const ttl = CACHE_DURATIONS[cacheKey];

		try {
			const result = await chrome.storage.local.get(storageKey);
			const entry = result[storageKey] as CacheEntry<T> | undefined;

			if (!entry) {
				logger.debug("Cache miss", { cacheKey, dataKey });
				return null;
			}

			const age = Date.now() - entry.timestamp;
			if (age > ttl) {
				logger.debug("Cache expired", { cacheKey, dataKey, age, ttl });
				await this.clear(cacheKey, dataKey);
				return null;
			}

			logger.debug("Cache hit", { cacheKey, dataKey, age });
			return entry.data;
		} catch (error) {
			logger.error("Cache get error", { error, cacheKey, dataKey });
			return null;
		}
	}

	/**
	 * Set cache data
	 */
	async set<T>(cacheKey: CacheKey, dataKey: string, data: T): Promise<void> {
		const storageKey = this.getStorageKey(cacheKey, dataKey);
		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
		};

		try {
			await chrome.storage.local.set({ [storageKey]: entry });
			logger.debug("Cache set", { cacheKey, dataKey });
		} catch (error) {
			logger.error("Cache set error", { error, cacheKey, dataKey });
		}
	}

	/**
	 * Clear specific cache entry
	 */
	async clear(cacheKey: CacheKey, dataKey: string): Promise<void> {
		const storageKey = this.getStorageKey(cacheKey, dataKey);

		try {
			await chrome.storage.local.remove(storageKey);
			logger.debug("Cache cleared", { cacheKey, dataKey });
		} catch (error) {
			logger.error("Cache clear error", { error, cacheKey, dataKey });
		}
	}

	/**
	 * Clear all cache entries for a specific cache key
	 */
	async clearAll(cacheKey: CacheKey): Promise<void> {
		try {
			const prefix = `${this.PREFIX}${cacheKey}:`;
			const allKeys = await chrome.storage.local.get(null);
			const keysToRemove = Object.keys(allKeys).filter((key) =>
				key.startsWith(prefix),
			);

			if (keysToRemove.length > 0) {
				await chrome.storage.local.remove(keysToRemove);
				logger.debug("Cache cleared all", {
					cacheKey,
					count: keysToRemove.length,
				});
			}
		} catch (error) {
			logger.error("Cache clear all error", { error, cacheKey });
		}
	}

	/**
	 * Get or fetch data with caching
	 */
	async getOrFetch<T>(
		cacheKey: CacheKey,
		dataKey: string,
		fetcher: () => Promise<T>,
	): Promise<T> {
		// Try cache first
		const cached = await this.get<T>(cacheKey, dataKey);
		if (cached !== null) {
			return cached;
		}

		// Fetch and cache
		logger.debug("Fetching data", { cacheKey, dataKey });
		const data = await fetcher();
		await this.set(cacheKey, dataKey, data);
		return data;
	}
}

export const cacheService = new CacheService();
