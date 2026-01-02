import type { Collection, TabItem, User, Workspace } from "@/types";

export interface ExportData {
	version: string;
	exportedAt: number;
	user?: {
		email: string;
		name: string;
	};
	data: {
		workspaces: Workspace[];
		collections: Collection[];
		tabs: TabItem[];
	};
}

/**
 * Format date for filename: YYYY-MM-DD
 */
function formatDateForFilename(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Sanitize string for use in filename
 */
function sanitizeFilename(name: string): string {
	return name
		.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.toLowerCase()
		.slice(0, 50);
}

/**
 * Download JSON data as a file
 */
function downloadJSON(data: ExportData, filename: string): void {
	const jsonString = JSON.stringify(data, null, 2);
	const blob = new Blob([jsonString], { type: "application/json" });
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}

/**
 * Export a single collection with its tabs
 */
export function exportCollection(
	collection: Collection,
	tabs: TabItem[],
	currentUser?: User | null,
): void {
	const collectionTabs = tabs.filter(
		(t) => t.collectionId === collection.id && !t.deletedAt,
	);

	if (collectionTabs.length === 0) {
		throw new Error("NO_DATA_TO_EXPORT");
	}

	const exportData: ExportData = {
		version: "1.0.0",
		exportedAt: Date.now(),
		user: currentUser
			? { email: currentUser.email, name: currentUser.name }
			: undefined,
		data: {
			workspaces: [],
			collections: [collection],
			tabs: collectionTabs,
		},
	};

	const dateStr = formatDateForFilename();
	const safeName = sanitizeFilename(collection.name);
	const filename = `aura-collection-${safeName}-${dateStr}.json`;

	downloadJSON(exportData, filename);
}

/**
 * Export a workspace with all its collections and tabs
 */
export function exportWorkspace(
	workspace: Workspace,
	collections: Collection[],
	tabs: TabItem[],
	currentUser?: User | null,
): void {
	const workspaceCollections = collections.filter(
		(c) => c.workspaceId === workspace.id && !c.deletedAt,
	);

	const collectionIds = new Set(workspaceCollections.map((c) => c.id));
	const workspaceTabs = tabs.filter(
		(t) => collectionIds.has(t.collectionId) && !t.deletedAt,
	);

	if (workspaceTabs.length === 0) {
		throw new Error("NO_DATA_TO_EXPORT");
	}

	const exportData: ExportData = {
		version: "1.0.0",
		exportedAt: Date.now(),
		user: currentUser
			? { email: currentUser.email, name: currentUser.name }
			: undefined,
		data: {
			workspaces: [workspace],
			collections: workspaceCollections,
			tabs: workspaceTabs,
		},
	};

	const dateStr = formatDateForFilename();
	const safeName = sanitizeFilename(workspace.name);
	const filename = `aura-workspace-${safeName}-${dateStr}.json`;

	downloadJSON(exportData, filename);
}

/**
 * Export all user data (all workspaces, collections, and tabs)
 */
export function exportAllData(
	workspaces: Workspace[],
	collections: Collection[],
	tabs: TabItem[],
	currentUser?: User | null,
): void {
	const activeWorkspaces = workspaces.filter((w) => !w.deletedAt);
	const activeCollections = collections.filter((c) => !c.deletedAt);
	const activeTabs = tabs.filter((t) => !t.deletedAt);

	if (activeTabs.length === 0) {
		throw new Error("NO_DATA_TO_EXPORT");
	}

	const exportData: ExportData = {
		version: "1.0.0",
		exportedAt: Date.now(),
		user: currentUser
			? { email: currentUser.email, name: currentUser.name }
			: undefined,
		data: {
			workspaces: activeWorkspaces,
			collections: activeCollections,
			tabs: activeTabs,
		},
	};

	const dateStr = formatDateForFilename();
	const filename = `aura-export-all-${dateStr}.json`;

	downloadJSON(exportData, filename);
}
