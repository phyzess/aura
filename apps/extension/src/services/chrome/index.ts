export {
	closeTabsById,
	getCurrentTabs,
	isExtension,
	openTab,
	openTabs,
	openTabsInNewWindow,
	type OpenProgress,
} from "./core";

export const ChromeService = {
	isExtension: () => {
		const { isExtension } = require("./core");
		return isExtension();
	},
	getCurrentTabs: async () => {
		const { getCurrentTabs } = require("./core");
		const result = await getCurrentTabs();
		if (result.ok) return result.value;
		throw result.error;
	},
	closeTabsById: async (tabIds: number[]) => {
		const { closeTabsById } = require("./core");
		const result = await closeTabsById(tabIds);
		if (!result.ok) throw result.error;
	},
	openTab: (url: string) => {
		const { openTab } = require("./core");
		openTab(url);
	},
	openTabs: async (urls: string[], onProgress?: any) => {
		const { openTabs } = require("./core");
		const result = await openTabs(urls, onProgress);
		if (!result.ok) throw result.error;
	},
	openTabsInNewWindow: async (urls: string[], onProgress?: any) => {
		const { openTabsInNewWindow } = require("./core");
		const result = await openTabsInNewWindow(urls, onProgress);
		if (!result.ok) throw result.error;
	},
};

