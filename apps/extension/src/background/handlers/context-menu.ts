import { CONTEXT_MENU_IDS, DEFAULT_VALUES } from "@aura/config";

export type SaveMode = "current-tab" | "link" | "all-tabs";

export interface SaveRequest {
	mode: SaveMode;
	timestamp: number;
	data: {
		url: string;
		title: string;
		favicon?: string;
	} | null;
}

export const setupContextMenus = (): void => {
	chrome.contextMenus.removeAll(() => {
		chrome.contextMenus.create({
			id: CONTEXT_MENU_IDS.MAIN,
			title: "Aura",
			contexts: ["page", "link", "selection"],
		});

		chrome.contextMenus.create({
			id: CONTEXT_MENU_IDS.SAVE_CURRENT_TAB,
			parentId: CONTEXT_MENU_IDS.MAIN,
			title: "Save current tab",
			contexts: ["page"],
		});

		chrome.contextMenus.create({
			id: CONTEXT_MENU_IDS.SAVE_LINK,
			parentId: CONTEXT_MENU_IDS.MAIN,
			title: "Save this link",
			contexts: ["link"],
		});

		chrome.contextMenus.create({
			id: CONTEXT_MENU_IDS.SAVE_ALL_TABS,
			parentId: CONTEXT_MENU_IDS.MAIN,
			title: "Save all tabs in window",
			contexts: ["page"],
		});

		chrome.contextMenus.create({
			id: CONTEXT_MENU_IDS.SEPARATOR_1,
			parentId: CONTEXT_MENU_IDS.MAIN,
			type: "separator",
			contexts: ["page", "link"],
		});

		chrome.contextMenus.create({
			id: CONTEXT_MENU_IDS.OPEN_DASHBOARD,
			parentId: CONTEXT_MENU_IDS.MAIN,
			title: "Open Dashboard",
			contexts: ["page", "link"],
		});
	});
};

export const extractTitleFromUrl = (url: string): string => {
	try {
		const domain = new URL(url).hostname.replace("www.", "");
		return domain;
	} catch {
		return DEFAULT_VALUES.SAVED_LINK_TITLE;
	}
};

import { STORAGE_KEYS } from "@aura/config";

export const createSaveRequest = (
	mode: SaveMode,
	tab?: chrome.tabs.Tab,
	linkUrl?: string,
): SaveRequest => {
	let data = null;

	if (mode === "current-tab" && tab) {
		data = {
			url: tab.url || "",
			title: tab.title || DEFAULT_VALUES.UNTITLED_TAB,
			favicon: tab.favIconUrl,
		};
	} else if (mode === "link" && linkUrl) {
		data = {
			url: linkUrl,
			title: extractTitleFromUrl(linkUrl),
			favicon: `https://www.google.com/s2/favicons?domain=${new URL(linkUrl).hostname}&sz=64`,
		};
	}

	return {
		mode,
		timestamp: Date.now(),
		data,
	};
};

export const openPopupWithSaveMode = async (
	mode: SaveMode,
	tab?: chrome.tabs.Tab,
	linkUrl?: string,
): Promise<void> => {
	const saveRequest = createSaveRequest(mode, tab, linkUrl);
	await chrome.storage.local.set({ [STORAGE_KEYS.SAVE_REQUEST]: saveRequest });
	await chrome.action.openPopup();
};

export const openDashboard = async (): Promise<void> => {
	const dashboardUrl = chrome.runtime.getURL("pages/dashboard.html");
	const tabs = await chrome.tabs.query({ url: dashboardUrl });

	if (tabs.length > 0 && tabs[0].id) {
		await chrome.tabs.update(tabs[0].id, { active: true });
		if (tabs[0].windowId) {
			await chrome.windows.update(tabs[0].windowId, { focused: true });
		}
	} else {
		await chrome.tabs.create({ url: dashboardUrl });
	}
};

export const handleContextMenuClick = async (
	info: chrome.contextMenus.OnClickData,
	tab?: chrome.tabs.Tab,
): Promise<void> => {
	switch (info.menuItemId) {
		case CONTEXT_MENU_IDS.SAVE_CURRENT_TAB:
			if (tab) {
				await openPopupWithSaveMode("current-tab", tab);
			}
			break;

		case CONTEXT_MENU_IDS.SAVE_LINK:
			if (info.linkUrl && tab) {
				await openPopupWithSaveMode("link", tab, info.linkUrl);
			}
			break;

		case CONTEXT_MENU_IDS.SAVE_ALL_TABS:
			await openPopupWithSaveMode("all-tabs");
			break;

		case CONTEXT_MENU_IDS.OPEN_DASHBOARD:
			await openDashboard();
			break;
	}
};
