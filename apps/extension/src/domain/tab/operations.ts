import type { TabItem } from "@/types";

export const createTab = (params: {
	collectionId: string;
	url: string;
	title: string;
	order: number;
}): TabItem => ({
	id: crypto.randomUUID(),
	collectionId: params.collectionId,
	url: params.url,
	title: params.title,
	faviconUrl: `https://www.google.com/s2/favicons?domain=${new URL(params.url).hostname}&sz=64`,
	order: params.order,
	createdAt: Date.now(),
	updatedAt: Date.now(),
});

export const createTabs = (params: {
	collectionId: string;
	tabs: Array<{ url: string; title: string }>;
	startOrder: number;
}): TabItem[] => {
	const now = Date.now();
	return params.tabs.map((tab, index) => ({
		id: crypto.randomUUID(),
		collectionId: params.collectionId,
		url: tab.url,
		title: tab.title,
		faviconUrl: `https://www.google.com/s2/favicons?domain=${new URL(tab.url).hostname}&sz=64`,
		order: params.startOrder + index,
		createdAt: now,
		updatedAt: now,
	}));
};

export const markTabAsDeleted = (tab: TabItem): TabItem => {
	const now = Date.now();
	return {
		...tab,
		deletedAt: now,
		updatedAt: now,
	};
};

export const toggleTabPin = (tab: TabItem): TabItem => ({
	...tab,
	isPinned: !tab.isPinned,
	updatedAt: Date.now(),
});

export const updateTab = (tab: TabItem, updates: Partial<TabItem>): TabItem => ({
	...tab,
	...updates,
	updatedAt: Date.now(),
});

export const reorderTab = (tab: TabItem, newOrder: number): TabItem => ({
	...tab,
	order: newOrder,
	updatedAt: Date.now(),
});

export const getTabsByCollection = (
	tabs: TabItem[],
	collectionId: string,
): TabItem[] => tabs.filter((t) => t.collectionId === collectionId && !t.deletedAt);

export const getActiveTabs = (tabs: TabItem[]): TabItem[] =>
	tabs.filter((t) => !t.deletedAt);

export const getPinnedTabs = (tabs: TabItem[]): TabItem[] =>
	tabs.filter((t) => t.isPinned && !t.deletedAt);

export const sortTabsByOrder = (tabs: TabItem[]): TabItem[] =>
	[...tabs].sort((a, b) => a.order - b.order);

