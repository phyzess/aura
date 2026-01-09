import { atom } from "jotai";
import { initDB, LocalDB } from "@/services/db";
import { activeWorkspaceIdAtom } from "@/features/workspace/store/atoms";
import { collectionsAtom } from "@/features/collection/store/atoms";
import { tabsAtom } from "@/features/tab/store/atoms";
import { workspacesAtom } from "@/features/workspace/store/atoms";
import { isLoadingAtom } from "./atoms";

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

