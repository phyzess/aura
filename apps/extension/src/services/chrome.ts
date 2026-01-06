import type { SessionTab } from "../types";

declare var chrome: any;

// Check if we are running in a Chrome Extension environment
const isExtension = () => {
	return typeof chrome !== "undefined" && !!chrome.tabs && !!chrome.windows;
};

export const ChromeService = {
	isExtension,

	/**
	 * Get all tabs from the current window.
	 * If in development (web) mode, returns mock data.
	 */
	getCurrentTabs: async (): Promise<SessionTab[]> => {
		if (isExtension()) {
			try {
				// Query tabs in the current window
				const tabs = await chrome.tabs.query({ currentWindow: true });

				// Transform chrome.tabs.Tab to our SessionTab structure
				const result: SessionTab[] = [];

				for (const tab of tabs as any[]) {
					const url: string = tab.url || "";
					const title: string = tab.title || "Untitled";

					// Skip tabs without a usable URL or internal chrome pages
					if (!url || url.startsWith("chrome://")) continue;

					let faviconUrl: string | undefined = tab.favIconUrl;

					// Best-effort favicon fallback based on hostname
					if (!faviconUrl) {
						try {
							const hostname = new URL(url).hostname;
							if (hostname) {
								faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
							}
						} catch {
							// Ignore URL parsing errors; favicon will just be undefined
						}
					}

					result.push({
						url,
						title,
						faviconUrl,
						chromeTabId: typeof tab.id === "number" ? tab.id : undefined,
					});
				}

				return result;
			} catch (e) {
				console.error("Error fetching chrome tabs:", e);
				return [];
			}
		} else {
			// Mock Data for Web Development
			console.log("Environment: Web (Mocking Chrome Tabs)");
			return [
				{
					url: "https://www.google.com",
					title: "Google Search",
					faviconUrl:
						"https://www.google.com/s2/favicons?domain=google.com&sz=64",
				},
				{
					url: "https://github.com",
					title: "GitHub - Where the world builds software",
					faviconUrl:
						"https://www.google.com/s2/favicons?domain=github.com&sz=64",
				},
				{
					url: "https://twitter.com",
					title: "X / Twitter",
					faviconUrl:
						"https://www.google.com/s2/favicons?domain=twitter.com&sz=64",
				},
				{
					url: "https://dribbble.com",
					title: "Dribbble - Discover the World’s Top Designers",
					faviconUrl:
						"https://www.google.com/s2/favicons?domain=dribbble.com&sz=64",
				},
				{
					url: "https://react.dev",
					title: "React",
					faviconUrl:
						"https://www.google.com/s2/favicons?domain=react.dev&sz=64",
				},
			] as SessionTab[];
		}
	},

	/**
	 * Close tabs by their Chrome tab IDs.
	 * Gracefully handles tabs that may already be closed.
	 */
	closeTabsById: async (tabIds: number[]): Promise<void> => {
		const ids = tabIds.filter((id) => typeof id === "number");
		if (!ids.length) return;

		if (!isExtension()) {
			console.log("Environment: Web (Mocking closeTabsById)", ids);
			return;
		}

		await new Promise<void>((resolve, reject) => {
			try {
				chrome.tabs.remove(ids, () => {
					const err = chrome.runtime?.lastError;
					if (err) {
						// If some tabs are already closed, ignore this as a non-fatal condition.
						if (err.message && err.message.includes("No tab with id")) {
							console.warn("Some tabs were already closed:", err.message);
							resolve();
							return;
						}
						console.error("Error closing tabs:", err.message);
						reject(new Error(err.message));
					} else {
						resolve();
					}
				});
			} catch (e) {
				reject(e);
			}
		});
	},

	/**
	 * Open a URL in a new tab
	 */
	openTab: (url: string) => {
		if (isExtension()) {
			chrome.tabs.create({ url });
		} else {
			window.open(url, "_blank");
		}
	},

	/**
	 * Open multiple URLs in the current window.
	 */
	openTabs: async (
		urls: string[],
		onProgress?: (progress: { total: number; opened: number }) => void,
	): Promise<void> => {
		const list = urls.filter(Boolean);
		if (!list.length) return;

		if (!isExtension()) {
			for (const url of list) {
				window.open(url, "_blank");
			}
			return;
		}

		let opened = 0;
		const total = list.length;

		for (const url of list) {
			// eslint-disable-next-line no-await-in-loop
			await new Promise<void>((resolve, reject) => {
				try {
					chrome.tabs.create({ url }, () => {
						const err = chrome.runtime?.lastError;
						if (err) {
							console.error("Error opening tab:", err.message);
							reject(new Error(err.message));
						} else {
							opened++;
							onProgress?.({ total, opened });
							resolve();
						}
					});
				} catch (e) {
					reject(e);
				}
			});
		}
	},

	/**
	 * Open multiple URLs grouped in a dedicated browser window.
	 */
	openTabsInNewWindow: async (
		urls: string[],
		onProgress?: (progress: { total: number; opened: number }) => void,
	): Promise<void> => {
		const list = urls.filter(Boolean);
		if (!list.length) return;

		if (!isExtension()) {
			for (const url of list) {
				window.open(url, "_blank");
			}
			return;
		}

		const [first, ...rest] = list;
		if (!first) return;

		const opened = 1;
		const total = list.length;

		const createdWindow: any = await new Promise((resolve, reject) => {
			try {
				chrome.windows.create({ url: first, focused: true }, (win: any) => {
					const err = chrome.runtime?.lastError;
					if (err) {
						console.error("Error creating window:", err.message);
						reject(new Error(err.message));
					} else {
						onProgress?.({ total, opened });
						resolve(win);
					}
				});
			} catch (e) {
				reject(e);
			}
		});

		const windowId = createdWindow?.id;
		if (!windowId) return;

		let currentOpened = opened;

		for (const url of rest) {
			// eslint-disable-next-line no-await-in-loop
			await new Promise<void>((resolve, reject) => {
				try {
					chrome.tabs.create({ windowId, url }, () => {
						const err = chrome.runtime?.lastError;
						if (err) {
							console.error("Error opening tab in new window:", err.message);
							reject(new Error(err.message));
						} else {
							currentOpened++;
							onProgress?.({ total, opened: currentOpened });
							resolve();
						}
					});
				} catch (e) {
					reject(e);
				}
			});
		}
	},
};
