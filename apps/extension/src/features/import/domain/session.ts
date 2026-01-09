import type { TabItem } from "@/types";

export interface CaptureSessionPayload {
	tabs: Partial<TabItem>[];
	targetWorkspaceId: string | "new";
	newWorkspaceName?: string;
	targetCollectionId: string | "new";
	newCollectionName?: string;
}

export interface ValidTab {
	url: string;
	title: string;
}

export const validateTab = (tab: Partial<TabItem>): ValidTab | null => {
	if (!tab.url || !tab.title) return null;
	return {
		url: tab.url,
		title: tab.title,
	};
};

export const extractValidTabs = (tabs: Partial<TabItem>[]): ValidTab[] => {
	return tabs
		.map(validateTab)
		.filter((tab): tab is ValidTab => tab !== null);
};

export const shouldCreateWorkspace = (
	targetWorkspaceId: string | "new",
	newWorkspaceName?: string,
): boolean => {
	return targetWorkspaceId === "new" && !!newWorkspaceName;
};

export const shouldCreateCollection = (
	targetCollectionId: string | "new",
	newCollectionName?: string,
): boolean => {
	return targetCollectionId === "new" && !!newCollectionName;
};

