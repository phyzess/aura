import { atom } from "jotai";
import { API_BASE_URL } from "@/config/env";
import { authClient } from "@/services/authClient";
import { initDB, LocalDB } from "@/services/db";
import type {
	Collection,
	SyncPayload,
	TabItem,
	User,
	Workspace,
} from "@/types";
import {
	activeWorkspaceIdAtom,
	authErrorAtom,
	authStatusAtom,
	collectionsAtom,
	currentUserAtom,
	isLoadingAtom,
	tabsAtom,
	themeModeAtom,
	workspacesAtom,
} from "./atoms";

export interface CaptureSessionPayload {
	tabs: Partial<TabItem>[];
	targetWorkspaceId: string | "new";
	newWorkspaceName?: string;
	targetCollectionId: string | "new";
	newCollectionName?: string;
}

export interface ImportTobyPayload {
	data: any;
	targetWorkspaceId: string | "new";
	newWorkspaceName?: string;
	targetCollectionId: string | "new";
	newCollectionName?: string;
}

const FAVICON_PATH = "/favicon.svg";

const mergeWithTombstones = <T extends { id: string }>(
	local: T[],
	incoming: T[],
): T[] => {
	const byId = new Map<string, T>();
	for (const item of local) {
		byId.set(item.id, item);
	}
	for (const item of incoming) {
		byId.set(item.id, item);
	}
	return Array.from(byId.values());
};

const updateFavicon = () => {
	const head = document.head;
	const oldLink = document.getElementById("favicon");

	if (oldLink) {
		head.removeChild(oldLink);
	}

	const newLink = document.createElement("link");
	newLink.id = "favicon";
	newLink.rel = "icon";
	newLink.type = "image/svg+xml";
	newLink.href = FAVICON_PATH;

	head.appendChild(newLink);
};

export const initThemeAtom = atom(null, (get) => {
	const theme = get(themeModeAtom);
	document.documentElement.classList.toggle("dark", theme === "dark");
	updateFavicon();
});

export const loadCurrentUserAtom = atom(null, async (_get, set) => {
	try {
		const res = await fetch(`${API_BASE_URL}/api/app/me`, {
			method: "GET",
			credentials: "include",
		});

		if (!res.ok) {
			set(currentUserAtom, null);
			return;
		}

		const data = (await res.json()) as { user: User | null };
		set(currentUserAtom, data.user ?? null);
	} catch {
		set(currentUserAtom, null);
	}
});

export const toggleThemeAtom = atom(null, (get, set) => {
	const current = get(themeModeAtom);
	const next = current === "light" ? "dark" : "light";
	set(themeModeAtom, next);
	localStorage.setItem("aura-theme", next);
	document.documentElement.classList.toggle("dark", next === "dark");
	updateFavicon();
});

export const initDataAtom = atom(null, async (get, set) => {
	set(isLoadingAtom, true);
	await initDB();

	const [workspaces, collections, tabs] = await Promise.all([
		LocalDB.getWorkspaces(),
		LocalDB.getCollections(),
		LocalDB.getTabs(),
	]);

	const activeWorkspaces = workspaces.filter((w) => !w.deletedAt);
	const activeCollections = collections.filter((c) => !c.deletedAt);
	const activeTabs = tabs.filter((t) => !t.deletedAt);

	set(workspacesAtom, activeWorkspaces);
	set(collectionsAtom, activeCollections);
	set(tabsAtom, activeTabs);

	const activeId = get(activeWorkspaceIdAtom);
	if (!activeId && activeWorkspaces.length > 0) {
		set(activeWorkspaceIdAtom, activeWorkspaces[0].id);
	}

	set(isLoadingAtom, false);
});

export const createWorkspaceAtom = atom(
	null,
	async (get, set, name: string) => {
		const workspaces = get(workspacesAtom);
		const newWorkspace: Workspace = {
			id: crypto.randomUUID(),
			name,
			order: workspaces.length,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await LocalDB.saveWorkspace(newWorkspace);
		set(workspacesAtom, [...workspaces, newWorkspace]);
		set(activeWorkspaceIdAtom, newWorkspace.id);

		return newWorkspace;
	},
);

export const updateWorkspaceNameAtom = atom(
	null,
	async (get, set, args: { id: string; name: string }) => {
		const workspaces = get(workspacesAtom);
		const updated = workspaces.map((w) =>
			w.id === args.id ? { ...w, name: args.name, updatedAt: Date.now() } : w,
		);
		set(workspacesAtom, updated);

		const workspace = updated.find((w) => w.id === args.id);
		if (workspace) await LocalDB.saveWorkspace(workspace);
	},
);

export const deleteWorkspaceAtom = atom(null, async (get, set, id: string) => {
	const workspaces = get(workspacesAtom);
	const collections = get(collectionsAtom);
	const tabs = get(tabsAtom);

	const workspace = workspaces.find((w) => w.id === id);
	const workspaceCollections = collections.filter((c) => c.workspaceId === id);
	const collectionIds = workspaceCollections.map((c) => c.id);
	const workspaceTabs = tabs.filter((t) =>
		collectionIds.includes(t.collectionId),
	);
	const now = Date.now();

	await Promise.all([
		workspace
			? LocalDB.saveWorkspace({
					...workspace,
					deletedAt: now,
					updatedAt: now,
				})
			: Promise.resolve(),
		...workspaceCollections.map((c) =>
			LocalDB.saveCollection({ ...c, deletedAt: now, updatedAt: now }),
		),
		...workspaceTabs.map((t) =>
			LocalDB.saveTab({ ...t, deletedAt: now, updatedAt: now }),
		),
	]);

	set(
		workspacesAtom,
		workspaces.filter((w) => w.id !== id),
	);
	set(
		collectionsAtom,
		collections.filter((c) => c.workspaceId !== id),
	);
	set(
		tabsAtom,
		tabs.filter((t) => !collectionIds.includes(t.collectionId)),
	);

	const activeId = get(activeWorkspaceIdAtom);
	if (activeId === id) {
		const remaining = workspaces.filter((w) => w.id !== id);
		set(activeWorkspaceIdAtom, remaining.length > 0 ? remaining[0].id : null);
	}
});

export const addCollectionAtom = atom(
	null,
	async (get, set, args: { workspaceId: string; name: string }) => {
		const collections = get(collectionsAtom);
		const workspaceCollections = collections.filter(
			(c) => c.workspaceId === args.workspaceId,
		);

		const newCollection: Collection = {
			id: crypto.randomUUID(),
			workspaceId: args.workspaceId,
			name: args.name,
			order: workspaceCollections.length,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await LocalDB.saveCollection(newCollection);
		set(collectionsAtom, [...collections, newCollection]);

		return newCollection;
	},
);

export const updateCollectionNameAtom = atom(
	null,
	async (get, set, args: { id: string; name: string }) => {
		const collections = get(collectionsAtom);
		const updated = collections.map((c) =>
			c.id === args.id ? { ...c, name: args.name, updatedAt: Date.now() } : c,
		);
		set(collectionsAtom, updated);

		const collection = updated.find((c) => c.id === args.id);
		if (collection) await LocalDB.saveCollection(collection);
	},
);

export const deleteCollectionAtom = atom(null, async (get, set, id: string) => {
	const collections = get(collectionsAtom);
	const tabs = get(tabsAtom);
	const collection = collections.find((c) => c.id === id);
	const collectionTabs = tabs.filter((t) => t.collectionId === id);
	const now = Date.now();

	await Promise.all([
		collection
			? LocalDB.saveCollection({
					...collection,
					deletedAt: now,
					updatedAt: now,
				})
			: Promise.resolve(),
		...collectionTabs.map((t) =>
			LocalDB.saveTab({ ...t, deletedAt: now, updatedAt: now }),
		),
	]);

	set(
		collectionsAtom,
		collections.filter((c) => c.id !== id),
	);
	set(
		tabsAtom,
		tabs.filter((t) => t.collectionId !== id),
	);
});

export const addTabAtom = atom(
	null,
	async (
		get,
		set,
		args: { collectionId: string; url: string; title: string },
	) => {
		const tabs = get(tabsAtom);
		const collectionTabs = tabs.filter(
			(t) => t.collectionId === args.collectionId,
		);

		const newTab: TabItem = {
			id: crypto.randomUUID(),
			collectionId: args.collectionId,
			url: args.url,
			title: args.title,
			faviconUrl: `https://www.google.com/s2/favicons?domain=${new URL(args.url).hostname}&sz=64`,
			order: collectionTabs.length,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await LocalDB.saveTab(newTab);
		set(tabsAtom, [...tabs, newTab]);

		return newTab;
	},
);

export const deleteTabAtom = atom(null, async (get, set, id: string) => {
	const tabs = get(tabsAtom);
	const tab = tabs.find((t) => t.id === id);
	const now = Date.now();

	if (tab) {
		await LocalDB.saveTab({ ...tab, deletedAt: now, updatedAt: now });
	}
	set(
		tabsAtom,
		tabs.filter((t) => t.id !== id),
	);
});

export const syncWithServerAtom = atom(null, async (get, set) => {
	const currentUser = get(currentUserAtom);
	if (!currentUser) {
		return;
	}

	await initDB();

	const [allWorkspaces, allCollections, allTabs] = await Promise.all([
		LocalDB.getWorkspaces(),
		LocalDB.getCollections(),
		LocalDB.getTabs(),
	]);

	const lastSync = (await LocalDB.getLastSyncTimestamp()) ?? 0;

	const payload: SyncPayload = {
		workspaces: allWorkspaces,
		collections: allCollections,
		tabs: allTabs,
		lastSyncTimestamp: lastSync,
	};

	try {
		const pushRes = await fetch(`${API_BASE_URL}/api/app/sync/push`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (pushRes.status === 401) {
			return;
		}
		if (!pushRes.ok) {
			return;
		}
	} catch {
		return;
	}

	let pullPayload: SyncPayload | null = null;
	try {
		const pullRes = await fetch(`${API_BASE_URL}/api/app/sync/pull`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ lastSyncTimestamp: lastSync }),
		});

		if (pullRes.status === 401) {
			return;
		}
		if (!pullRes.ok) {
			return;
		}
		pullPayload = (await pullRes.json()) as SyncPayload;
	} catch {
		return;
	}

	if (!pullPayload) return;

	const mergedWorkspaces = mergeWithTombstones<Workspace>(
		allWorkspaces,
		pullPayload.workspaces,
	);
	const mergedCollections = mergeWithTombstones<Collection>(
		allCollections,
		pullPayload.collections,
	);
	const mergedTabs = mergeWithTombstones<TabItem>(allTabs, pullPayload.tabs);

	await Promise.all([
		LocalDB.saveAllWorkspaces(mergedWorkspaces),
		LocalDB.saveAllCollections(mergedCollections),
		LocalDB.saveAllTabs(mergedTabs),
		LocalDB.saveLastSyncTimestamp(pullPayload.lastSyncTimestamp),
	]);

	const activeWorkspaces = mergedWorkspaces.filter((w) => !w.deletedAt);
	const activeCollections = mergedCollections.filter((c) => !c.deletedAt);
	const activeTabs = mergedTabs.filter((t) => !t.deletedAt);

	set(workspacesAtom, activeWorkspaces);
	set(collectionsAtom, activeCollections);
	set(tabsAtom, activeTabs);

	const activeId = get(activeWorkspaceIdAtom);
	if (!activeId && activeWorkspaces.length > 0) {
		set(activeWorkspaceIdAtom, activeWorkspaces[0].id);
	} else if (
		activeId &&
		activeWorkspaces.every((workspace) => workspace.id !== activeId)
	) {
		set(
			activeWorkspaceIdAtom,
			activeWorkspaces.length > 0 ? activeWorkspaces[0].id : null,
		);
	}
});

export const signUpAtom = atom(
	null,
	async (
		_get,
		set,
		payload: { name: string; email: string; password: string },
	) => {
		const { error } = await authClient.signUp.email({
			name: payload.name,
			email: payload.email,
			password: payload.password,
		});

		if (error) {
			throw new Error(error.message || "Failed to sign up");
		}

		await set(loadCurrentUserAtom);
	},
);

export const signInAtom = atom(
	null,
	async (_get, set, payload: { email: string; password: string }) => {
		const { error } = await authClient.signIn.email({
			email: payload.email,
			password: payload.password,
		});

		if (error) {
			throw new Error(error.message || "Failed to sign in");
		}

		await set(loadCurrentUserAtom);
	},
);

export const signOutAtom = atom(null, async (get, set) => {
	set(authStatusAtom, "signingOut");
	set(authErrorAtom, null);

	try {
		await authClient.signOut();
		await set(loadCurrentUserAtom);

		const user = get(currentUserAtom);
		const ok = !user;
		if (!ok) {
			set(authErrorAtom, "Failed to sign out. Please try again.");
		}
		return ok;
	} catch (err) {
		console.error("Sign out failed", err);
		set(
			authErrorAtom,
			"Failed to sign out. Please check your connection and try again.",
		);
		return false;
	} finally {
		set(authStatusAtom, "idle");
	}
});

export const clearLocalDataAtom = atom(null, async (_get, set) => {
	set(workspacesAtom, []);
	set(collectionsAtom, []);
	set(tabsAtom, []);
	set(activeWorkspaceIdAtom, null);

	await LocalDB.clearAll();
});

export const captureSessionAtom = atom(
	null,
	async (_get, set, payload: CaptureSessionPayload) => {
		let workspaceId = payload.targetWorkspaceId;

		if (workspaceId === "new" && payload.newWorkspaceName) {
			const newWorkspace = await set(
				createWorkspaceAtom,
				payload.newWorkspaceName,
			);
			workspaceId = newWorkspace.id;
		}

		if (workspaceId === "new") return;

		let collectionId = payload.targetCollectionId;

		if (collectionId === "new" && payload.newCollectionName) {
			const newCollection = await set(addCollectionAtom, {
				workspaceId,
				name: payload.newCollectionName,
			});
			collectionId = newCollection.id;
		}

		if (collectionId === "new") return;

		for (const tab of payload.tabs) {
			if (tab.url && tab.title) {
				await set(addTabAtom, {
					collectionId,
					url: tab.url,
					title: tab.title,
				});
			}
		}
	},
);

export const importTobyDataAtom = atom(
	null,
	async (_get, set, payload: ImportTobyPayload) => {
		let workspaceId = payload.targetWorkspaceId;

		if (workspaceId === "new" && payload.newWorkspaceName) {
			const newWorkspace = await set(
				createWorkspaceAtom,
				payload.newWorkspaceName,
			);
			workspaceId = newWorkspace.id;
		}

		if (workspaceId === "new") return;

		const tobyData = payload.data;
		if (!tobyData?.lists || !Array.isArray(tobyData.lists)) return;

		for (const list of tobyData.lists) {
			if (!list.title || !list.cards || !Array.isArray(list.cards)) continue;

			const collection = await set(addCollectionAtom, {
				workspaceId,
				name: list.title,
			});

			for (const card of list.cards) {
				if (card.url && card.title) {
					await set(addTabAtom, {
						collectionId: collection.id,
						url: card.url,
						title: card.title,
					});
				}
			}
		}
	},
);
