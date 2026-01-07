export interface User {
	id: string;
	email: string;
	name: string;
	createdAt: number;
	updatedAt: number;
}

export interface Workspace {
	id: string;
	userId: string | null;
	name: string;
	description: string | null;
	order: number;
	createdAt: number;
	updatedAt: number;
	deletedAt: number | null;
}

export interface Collection {
	id: string;
	workspaceId: string;
	userId: string | null;
	name: string;
	description: string | null;
	order: number;
	createdAt: number;
	updatedAt: number;
	deletedAt: number | null;
}

export interface TabItem {
	id: string;
	collectionId: string;
	userId: string | null;
	url: string;
	title: string;
	faviconUrl: string | null;
	isPinned: boolean;
	order: number;
	createdAt: number;
	updatedAt: number;
	deletedAt: number | null;
}

export interface SyncPayload {
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
	lastSyncTimestamp: number;
}
