import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { AuthDialog } from "@/components/AuthDialog";
import { Header } from "@/components/Header";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { Sidebar } from "@/components/Sidebar";
import { GlobalTabSearchModal } from "@/components/tab-search";
import { WorkspaceView } from "@/components/WorkspaceView";
import { useHotkey } from "@/hooks/useHotkey";
import * as m from "@/paraglide/messages";
import {
	clearLocalDataAtom,
	initDataAtom,
	initThemeAtom,
	loadCurrentUserAtom,
	signOutAtom,
	syncWithServerAtom,
} from "@/store/actions";
import {
	activeWorkspaceIdAtom,
	collectionsAtom,
	currentUserAtom,
	isLoadingAtom,
	localeAtom,
	tabsAtom,
	workspacesAtom,
} from "@/store/atoms";
import { activeWorkspaceAtom } from "@/store/selectors";

export default function App() {
	// subscribe to locale changes so the whole tree re-renders when language changes
	useAtomValue(localeAtom);

	const isLoading = useAtomValue(isLoadingAtom);
	const workspaces = useAtomValue(workspacesAtom);
	const collections = useAtomValue(collectionsAtom);
	const tabs = useAtomValue(tabsAtom);
	const activeWorkspaceId = useAtomValue(activeWorkspaceIdAtom);
	const activeWorkspace = useAtomValue(activeWorkspaceAtom);
	const currentUser = useAtomValue(currentUserAtom);

	const initData = useSetAtom(initDataAtom);
	const initTheme = useSetAtom(initThemeAtom);
	const loadCurrentUser = useSetAtom(loadCurrentUserAtom);
	const syncWithServer = useSetAtom(syncWithServerAtom);
	const signOut = useSetAtom(signOutAtom);
	const clearLocalData = useSetAtom(clearLocalDataAtom);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [focusedTabId, setFocusedTabId] = useState<string | null>(null);
	const setActiveWorkspaceId = useSetAtom(activeWorkspaceIdAtom);
	const [isAuthOpen, setIsAuthOpen] = useState(false);
	const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

	useEffect(() => {
		initData();
		initTheme();
		loadCurrentUser();
	}, [initData, initTheme, loadCurrentUser]);

	useEffect(() => {
		if (!currentUser) return;
		syncWithServer({ source: "auto" });
	}, [currentUser, syncWithServer]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (currentUser || isAuthOpen) return;

		const params = new URLSearchParams(window.location.search);
		if (params.get("auth") === "1") {
			setIsAuthOpen(true);
			params.delete("auth");
			const newSearch = params.toString();
			const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}${window.location.hash}`;
			window.history.replaceState({}, "", newUrl);
		}
	}, [currentUser, isAuthOpen]);

	useHotkey("mod+k", (event) => {
		event.preventDefault();
		setIsSearchOpen(true);
	});

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-cloud-50 dark:bg-cloud-950">
				<div className="text-cloud-600 dark:text-cloud-400">
					{m.dashboard_loading()}
				</div>
			</div>
		);
	}

	const userLabel = currentUser
		? (currentUser.name ?? currentUser.email)
		: null;

	return (
		<div className="relative flex h-screen bg-cloud-50 dark:bg-slate-950 overflow-hidden">
			<Sidebar
				workspaces={workspaces}
				collections={collections}
				tabs={tabs}
				activeWorkspaceId={activeWorkspaceId}
				currentUserEmail={userLabel}
				onOpenAuth={() => setIsAuthOpen(true)}
				onSignOut={() => setIsLogoutDialogOpen(true)}
			/>
			<div className="flex flex-1 flex-col">
				<Header
					workspaceName={activeWorkspace?.name || ""}
					onOpenSearch={() => setIsSearchOpen(true)}
				/>
				<WorkspaceView
					workspaceId={activeWorkspaceId}
					collections={collections}
					tabs={tabs}
					focusedTabId={focusedTabId}
					onHighlightComplete={() => setFocusedTabId(null)}
				/>
				<AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
				<LogoutConfirmDialog
					isOpen={isLogoutDialogOpen}
					onClose={() => setIsLogoutDialogOpen(false)}
					onConfirm={async ({ clearLocalData: shouldClear }) => {
						const ok = await signOut();
						if (!ok) {
							return;
						}
						if (shouldClear) {
							await clearLocalData();
						}
						setIsLogoutDialogOpen(false);
					}}
				/>
			</div>
			<GlobalTabSearchModal
				isOpen={isSearchOpen}
				onClose={() => setIsSearchOpen(false)}
				workspaces={workspaces}
				collections={collections}
				tabs={tabs}
				onSelectTab={(tabId) => {
					const tab = tabs.find((t) => t.id === tabId);
					if (!tab) return;
					const collection = collections.find((c) => c.id === tab.collectionId);
					if (collection && collection.workspaceId !== activeWorkspaceId) {
						setActiveWorkspaceId(collection.workspaceId);
					}
					setFocusedTabId(tabId);
				}}
			/>
		</div>
	);
}
