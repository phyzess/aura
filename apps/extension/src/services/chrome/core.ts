import type { Result } from "@aura/shared";
import { ok, tryCatchAsync } from "@aura/shared";
import type { SessionTab } from "@/types";

export const isExtension = (): boolean =>
	typeof chrome !== "undefined" && !!chrome.tabs && !!chrome.windows;

export const getCurrentTabs = async (): Promise<
	Result<SessionTab[], Error>
> => {
	if (!isExtension()) {
		return ok(getMockTabs());
	}

	return tryCatchAsync(async () => {
		const tabs = await chrome.tabs.query({ currentWindow: true });
		return transformChromeTabs(tabs);
	});
};

const transformChromeTabs = (tabs: chrome.tabs.Tab[]): SessionTab[] => {
	const result: SessionTab[] = [];

	for (const tab of tabs) {
		const url: string = tab.url || "";
		const title: string = tab.title || "Untitled";

		if (!url || url.startsWith("chrome://")) continue;

		let faviconUrl: string | undefined = tab.favIconUrl;

		if (!faviconUrl) {
			try {
				const hostname = new URL(url).hostname;
				if (hostname) {
					faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
				}
			} catch {
				// Ignore
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
};

const getMockTabs = (): SessionTab[] => [
	{
		url: "https://www.google.com",
		title: "Google Search",
		faviconUrl: "https://www.google.com/s2/favicons?domain=google.com&sz=64",
	},
	{
		url: "https://github.com",
		title: "GitHub - Where the world builds software",
		faviconUrl: "https://www.google.com/s2/favicons?domain=github.com&sz=64",
	},
	{
		url: "https://twitter.com",
		title: "X / Twitter",
		faviconUrl: "https://www.google.com/s2/favicons?domain=twitter.com&sz=64",
	},
];

export const closeTabsById = async (
	tabIds: number[],
): Promise<Result<void, Error>> => {
	const ids = tabIds.filter((id) => typeof id === "number");
	if (ids.length === 0) return ok(undefined);

	if (!isExtension()) {
		console.log("Environment: Web (Mocking closeTabsById)", ids);
		return ok(undefined);
	}

	return tryCatchAsync(
		() =>
			new Promise<void>((resolve, reject) => {
				chrome.tabs.remove(ids, () => {
					const error = chrome.runtime?.lastError;
					if (error) {
						if (error.message && error.message.includes("No tab with id")) {
							console.warn("Some tabs were already closed:", error.message);
							resolve();
							return;
						}
						reject(new Error(error.message));
					} else {
						resolve();
					}
				});
			}),
	);
};

export const openTab = (url: string): void => {
	if (isExtension()) {
		chrome.tabs.create({ url });
	} else {
		window.open(url, "_blank");
	}
};

export interface OpenProgress {
	total: number;
	opened: number;
}

export const openTabs = async (
	urls: string[],
	onProgress?: (progress: OpenProgress) => void,
): Promise<Result<void, Error>> => {
	const list = urls.filter(Boolean);
	if (list.length === 0) return ok(undefined);

	if (!isExtension()) {
		for (const url of list) {
			window.open(url, "_blank");
		}
		return ok(undefined);
	}

	return tryCatchAsync(async () => {
		let opened = 0;
		const total = list.length;

		for (const url of list) {
			await new Promise<void>((resolve, reject) => {
				chrome.tabs.create({ url }, () => {
					const error = chrome.runtime?.lastError;
					if (error) {
						reject(new Error(error.message));
					} else {
						opened++;
						onProgress?.({ total, opened });
						resolve();
					}
				});
			});
		}
	});
};

export const openTabsInNewWindow = async (
	urls: string[],
	onProgress?: (progress: OpenProgress) => void,
): Promise<Result<void, Error>> => {
	const list = urls.filter(Boolean);
	if (list.length === 0) return ok(undefined);

	if (!isExtension()) {
		for (const url of list) {
			window.open(url, "_blank");
		}
		return ok(undefined);
	}

	return tryCatchAsync(async () => {
		const [first, ...rest] = list;
		if (!first) return;

		const total = list.length;
		let opened = 1;

		const createdWindow = await new Promise<chrome.windows.Window | undefined>(
			(resolve, reject) => {
				chrome.windows.create(
					{ url: first, focused: true },
					(win: chrome.windows.Window | undefined) => {
						const error = chrome.runtime?.lastError;
						if (error) {
							reject(new Error(error.message));
						} else {
							onProgress?.({ total, opened });
							resolve(win);
						}
					},
				);
			},
		);

		const windowId = createdWindow?.id;
		if (!windowId) return;

		for (const url of rest) {
			await new Promise<void>((resolve, reject) => {
				chrome.tabs.create({ windowId, url }, () => {
					const error = chrome.runtime?.lastError;
					if (error) {
						reject(new Error(error.message));
					} else {
						opened++;
						onProgress?.({ total, opened });
						resolve();
					}
				});
			});
		}
	});
};
