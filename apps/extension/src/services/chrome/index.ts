import {
	closeTabsById,
	getCurrentTabs,
	isExtension,
	type OpenProgress,
	openTab,
	openTabs,
	openTabsInNewWindow,
} from "./core";

export {
	closeTabsById,
	getCurrentTabs,
	isExtension,
	type OpenProgress,
	openTab,
	openTabs,
	openTabsInNewWindow,
};

export const ChromeService = {
	isExtension: () => {
		return isExtension();
	},
	getCurrentTabs: async () => {
		const result = await getCurrentTabs();
		if (result.ok) return result.value;
		throw result.error;
	},
	closeTabsById: async (tabIds: number[]) => {
		const result = await closeTabsById(tabIds);
		if (!result.ok) throw result.error;
	},
	openTab: (url: string) => {
		openTab(url);
	},
	openTabs: async (
		urls: string[],
		onProgress?: (progress: OpenProgress) => void,
	) => {
		const result = await openTabs(urls, onProgress);
		if (!result.ok) throw result.error;
	},
	openTabsInNewWindow: async (
		urls: string[],
		onProgress?: (progress: OpenProgress) => void,
	) => {
		const result = await openTabsInNewWindow(urls, onProgress);
		if (!result.ok) throw result.error;
	},
};
