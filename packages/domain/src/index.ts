export interface User {
	id: string;
	email: string;
	name: string;
	createdAt: number;
	updatedAt: number;
}

export interface Workspace {
	id: string;
	userId?: string;
	name: string;
	description?: string;
	order: number;
	createdAt: number;
	updatedAt: number;
	deletedAt?: number;
}

export interface Collection {
	id: string;
	workspaceId: string;
	userId?: string;
	name: string;
	description?: string;
	order: number;
	createdAt: number;
	updatedAt: number;
	deletedAt?: number;
}

export interface TabItem {
	id: string;
	collectionId: string;
	userId?: string;
	url: string;
	title: string;
	faviconUrl?: string;
	isPinned?: boolean;
	order: number;
	createdAt: number;
	updatedAt: number;
	deletedAt?: number;
}

export interface SyncPayload {
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
	lastSyncTimestamp: number;
}
