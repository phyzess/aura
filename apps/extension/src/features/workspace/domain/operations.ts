import type { Workspace } from "@/types";

export const createWorkspace = (params: {
	name: string;
	description?: string;
	order: number;
}): Workspace => ({
	id: crypto.randomUUID(),
	userId: null,
	name: params.name,
	description: params.description ?? null,
	order: params.order,
	createdAt: Date.now(),
	updatedAt: Date.now(),
	deletedAt: null,
});

export const updateWorkspace = (
	workspace: Workspace,
	updates: Partial<Workspace>,
): Workspace => ({
	...workspace,
	...updates,
	updatedAt: Date.now(),
});

export const markWorkspaceAsDeleted = (workspace: Workspace): Workspace => {
	const now = Date.now();
	return {
		...workspace,
		deletedAt: now,
		updatedAt: now,
	};
};

export const reorderWorkspace = (
	workspace: Workspace,
	newOrder: number,
): Workspace => ({
	...workspace,
	order: newOrder,
	updatedAt: Date.now(),
});

export const getActiveWorkspaces = (workspaces: Workspace[]): Workspace[] =>
	workspaces.filter((w) => !w.deletedAt);

export const sortWorkspacesByOrder = (workspaces: Workspace[]): Workspace[] =>
	[...workspaces].sort((a, b) => a.order - b.order);
