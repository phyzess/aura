import {
	CACHE_DURATIONS,
	LINK_CHECK_CONFIG,
	TIMEOUT_DURATIONS,
} from "@aura/config";
import type { LinkStatus } from "@/types";

interface CheckResult {
	url: string;
	status: LinkStatus;
	checkedAt: number;
}

interface CheckProgress {
	total: number;
	checked: number;
	current: string;
}

type ProgressCallback = (progress: CheckProgress) => void;

class LinkCheckService {
	private cache = new Map<string, CheckResult>();
	private readonly CACHE_DURATION = CACHE_DURATIONS.LINK_CHECK;
	private readonly REQUEST_TIMEOUT = TIMEOUT_DURATIONS.LINK_CHECK_REQUEST;
	private readonly MAX_CONCURRENT = LINK_CHECK_CONFIG.MAX_CONCURRENT;

	/**
	 * Check if a URL is valid/accessible
	 */
	async checkUrl(url: string): Promise<LinkStatus> {
		// Check cache first
		const cached = this.cache.get(url);
		if (cached && Date.now() - cached.checkedAt < this.CACHE_DURATION) {
			return cached.status;
		}

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				this.REQUEST_TIMEOUT,
			);

			await fetch(url, {
				method: "HEAD",
				signal: controller.signal,
				mode: "no-cors",
			});

			clearTimeout(timeoutId);

			const status: LinkStatus = "valid";

			this.cache.set(url, {
				url,
				status,
				checkedAt: Date.now(),
			});

			return status;
		} catch (error) {
			let status: LinkStatus = "uncertain";

			if (error instanceof Error) {
				// Network errors or timeouts
				if (error.name === "AbortError") {
					status = "uncertain"; // Timeout
				} else if (error.message.includes("Failed to fetch")) {
					// Could be CORS, network issue, or actually broken
					// We mark as uncertain rather than broken
					status = "uncertain";
				}
			}

			this.cache.set(url, {
				url,
				status,
				checkedAt: Date.now(),
			});

			return status;
		}
	}

	/**
	 * Check multiple URLs with rate limiting and progress callback
	 */
	async checkMultipleUrls(
		urls: string[],
		onProgress?: ProgressCallback,
	): Promise<Map<string, LinkStatus>> {
		const results = new Map<string, LinkStatus>();
		const uniqueUrls = [...new Set(urls)]; // Remove duplicates

		// Report initial progress
		if (onProgress) {
			onProgress({
				total: uniqueUrls.length,
				checked: 0,
				current: "",
			});
		}

		// Process in batches to limit concurrent requests
		for (let i = 0; i < uniqueUrls.length; i += this.MAX_CONCURRENT) {
			const batch = uniqueUrls.slice(i, i + this.MAX_CONCURRENT);

			// Check batch concurrently
			const batchResults = await Promise.allSettled(
				batch.map(async (url) => {
					const status = await this.checkUrl(url);
					return { url, status };
				}),
			);

			// Process results
			for (const result of batchResults) {
				if (result.status === "fulfilled") {
					results.set(result.value.url, result.value.status);
				}
			}

			// Report progress after each batch
			const checkedCount = Math.min(i + this.MAX_CONCURRENT, uniqueUrls.length);
			if (onProgress) {
				onProgress({
					total: uniqueUrls.length,
					checked: checkedCount,
					current: batch[batch.length - 1] || "",
				});
			}

			// Small delay between batches to avoid overwhelming the browser
			if (i + this.MAX_CONCURRENT < uniqueUrls.length) {
				await new Promise((resolve) => setTimeout(resolve, 200));
			}
		}

		return results;
	}

	/**
	 * Clear cache for specific URLs or all
	 */
	clearCache(urls?: string[]) {
		if (urls) {
			for (const url of urls) {
				this.cache.delete(url);
			}
		} else {
			this.cache.clear();
		}
	}

	/**
	 * Get cached result for a URL
	 */
	getCached(url: string): CheckResult | undefined {
		const cached = this.cache.get(url);
		if (cached && Date.now() - cached.checkedAt < this.CACHE_DURATION) {
			return cached;
		}
		return undefined;
	}
}

export const linkCheckService = new LinkCheckService();
