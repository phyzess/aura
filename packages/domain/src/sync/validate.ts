import type { Collection, TabItem, Workspace } from "../types";

const isNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

const isString = (value: unknown): value is string => typeof value === "string";

export const isValidWorkspace = (item: unknown): item is Workspace => {
	if (!item || typeof item !== "object") return false;
	const w = item as any;
	return (
		isString(w.id) &&
		isString(w.name) &&
		isNumber(w.order) &&
		isNumber(w.createdAt) &&
		isNumber(w.updatedAt) &&
		(w.deletedAt === undefined || w.deletedAt === null || isNumber(w.deletedAt))
	);
};

export const isValidCollection = (item: unknown): item is Collection => {
	if (!item || typeof item !== "object") return false;
	const c = item as any;
	return (
		isString(c.id) &&
		isString(c.workspaceId) &&
		isString(c.name) &&
		isNumber(c.order) &&
		isNumber(c.createdAt) &&
		isNumber(c.updatedAt) &&
		(c.deletedAt === undefined || c.deletedAt === null || isNumber(c.deletedAt))
	);
};

export const isValidTabItem = (item: unknown): item is TabItem => {
	if (!item || typeof item !== "object") return false;
	const t = item as any;
	return (
		isString(t.id) &&
		isString(t.collectionId) &&
		isString(t.url) &&
		isString(t.title) &&
		isNumber(t.order) &&
		isNumber(t.createdAt) &&
		isNumber(t.updatedAt) &&
		(t.deletedAt === undefined || t.deletedAt === null || isNumber(t.deletedAt))
	);
};

export const validateWorkspaces = (items: unknown[]): Workspace[] => {
	if (!Array.isArray(items)) return [];
	return items.filter(isValidWorkspace);
};

export const validateCollections = (items: unknown[]): Collection[] => {
	if (!Array.isArray(items)) return [];
	return items.filter(isValidCollection);
};

export const validateTabs = (items: unknown[]): TabItem[] => {
	if (!Array.isArray(items)) return [];
	return items.filter(isValidTabItem);
};

export const validateRelationships = (
	workspaces: Workspace[],
	collections: Collection[],
	tabs: TabItem[],
): { valid: boolean; errors: string[] } => {
	const errors: string[] = [];
	const workspaceIds = new Set(workspaces.map((w) => w.id));
	const collectionIds = new Set(collections.map((c) => c.id));

	for (const col of collections) {
		if (!workspaceIds.has(col.workspaceId)) {
			errors.push(`Collection ${col.id} has invalid workspaceId`);
		}
	}

	for (const tab of tabs) {
		if (!collectionIds.has(tab.collectionId)) {
			errors.push(`Tab ${tab.id} has invalid collectionId`);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
};
