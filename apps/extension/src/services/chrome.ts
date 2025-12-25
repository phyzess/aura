import type { TabItem } from "../types";

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
	getCurrentTabs: async (): Promise<Partial<TabItem>[]> => {
		if (isExtension()) {
			try {
				// Query tabs in the current window
				const tabs = await chrome.tabs.query({ currentWindow: true });

				// Transform chrome.tabs.Tab to our TabItem structure (partial)
				const result: Partial<TabItem>[] = [];

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

					result.push({ url, title, faviconUrl });
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
			];
		}
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
	openTabs: async (urls: string[]): Promise<void> => {
		const list = urls.filter(Boolean);
		if (!list.length) return;

		if (!isExtension()) {
			for (const url of list) {
				window.open(url, "_blank");
			}
			return;
		}

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
	openTabsInNewWindow: async (urls: string[]): Promise<void> => {
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

		const createdWindow: any = await new Promise((resolve, reject) => {
			try {
				chrome.windows.create({ url: first, focused: true }, (win: any) => {
					const err = chrome.runtime?.lastError;
					if (err) {
						console.error("Error creating window:", err.message);
						reject(new Error(err.message));
					} else {
						resolve(win);
					}
				});
			} catch (e) {
				reject(e);
			}
		});

		const windowId = createdWindow?.id;
		if (!windowId) return;

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
