import type { LinkStatus, TabItem } from "@/types";

export interface LinkCheckStats {
	total: number;
	valid: number;
	broken: number;
	uncertain: number;
}

export interface LinkCheckProgress {
	total: number;
	checked: number;
}

export const setTabCheckingStatus = (
	tabs: TabItem[],
	tabId: string,
): TabItem[] => {
	return tabs.map((tab) =>
		tab.id === tabId
			? { ...tab, linkStatus: "checking" as LinkStatus }
			: tab,
	);
};

export const setMultipleTabsCheckingStatus = (
	tabs: TabItem[],
	tabIds: string[],
): TabItem[] => {
	return tabs.map((tab) =>
		tabIds.includes(tab.id)
			? { ...tab, linkStatus: "checking" as LinkStatus }
			: tab,
	);
};

export const updateTabLinkStatus = (
	tabs: TabItem[],
	tabId: string,
	status: LinkStatus,
	timestamp: number,
): TabItem[] => {
	return tabs.map((tab) =>
		tab.id === tabId
			? {
					...tab,
					linkStatus: status,
					lastCheckedAt: timestamp,
					updatedAt: timestamp,
				}
			: tab,
	);
};

export const updateMultipleTabsLinkStatus = (
	tabs: TabItem[],
	results: Map<string, LinkStatus>,
	timestamp: number,
): TabItem[] => {
	return tabs.map((tab) => {
		const status = results.get(tab.id);
		if (!status) return tab;

		return {
			...tab,
			linkStatus: status,
			lastCheckedAt: timestamp,
			updatedAt: timestamp,
		};
	});
};

export const calculateLinkCheckStats = (
	tabs: TabItem[],
	tabIds: string[],
): LinkCheckStats => {
	const checkedTabs = tabs.filter((tab) => tabIds.includes(tab.id));

	return {
		total: checkedTabs.length,
		valid: checkedTabs.filter((tab) => tab.linkStatus === "valid").length,
		broken: checkedTabs.filter((tab) => tab.linkStatus === "broken").length,
		uncertain: checkedTabs.filter((tab) => tab.linkStatus === "uncertain")
			.length,
	};
};

export const filterTabsByIds = (
	tabs: TabItem[],
	tabIds: string[],
): TabItem[] => {
	return tabs.filter((tab) => tabIds.includes(tab.id));
};

export const findTabById = (
	tabs: TabItem[],
	tabId: string,
): TabItem | undefined => {
	return tabs.find((tab) => tab.id === tabId);
};

export const createLinkCheckProgress = (
	total: number,
	checked: number,
): LinkCheckProgress => ({
	total,
	checked,
});

export const createEmptyStats = (): LinkCheckStats => ({
	total: 0,
	valid: 0,
	broken: 0,
	uncertain: 0,
});

