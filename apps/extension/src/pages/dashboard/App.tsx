import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { AuthDialog } from "@/components/AuthDialog";
import { Header } from "@/components/Header";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Sidebar } from "@/components/Sidebar";
import { GlobalTabSearchModal } from "@/components/tab-search";
import { WorkspaceView } from "@/components/WorkspaceView";
import { changeLocale } from "@/config/locale";
import { useHotkey } from "@/hooks/useHotkey";
import * as m from "@/paraglide/messages";
import { offlineDetector } from "@/services/offlineDetector";
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
	loadingMessageAtom,
	loadingStageAtom,
	localeAtom,
	tabsAtom,
	themeModeAtom,
	workspacesAtom,
} from "@/store/atoms";
import { activeWorkspaceAtom } from "@/store/selectors";

const WORKSPACE_RESTORE_CONFIRM_THRESHOLD = 25;

export default function App() {
	// subscribe to locale changes so the whole tree re-renders when language changes
	useAtomValue(localeAtom);

	const isLoading = useAtomValue(isLoadingAtom);
	const loadingStage = useAtomValue(loadingStageAtom);
	const loadingMessage = useAtomValue(loadingMessageAtom);
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
	const setThemeMode = useSetAtom(themeModeAtom);
	const setLocale = useSetAtom(localeAtom);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [focusedTabId, setFocusedTabId] = useState<string | null>(null);
	const setActiveWorkspaceId = useSetAtom(activeWorkspaceIdAtom);
	const [isAuthOpen, setIsAuthOpen] = useState(false);
	const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
	const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);

	useEffect(() => {
		initData();
		initTheme();
		loadCurrentUser();

		// Initialize offline detector
		offlineDetector.getStatus();
	}, [initData, initTheme, loadCurrentUser]);

	// 监听设置变化
	useEffect(() => {
		const handleStorageChange = (
			changes: { [key: string]: chrome.storage.StorageChange },
			areaName: string,
		) => {
			if (areaName !== "local") return;

			if (changes["aura-theme"]) {
				const newTheme = changes["aura-theme"].newValue as "light" | "dark";
				setThemeMode(newTheme);
				document.documentElement.classList.toggle("dark", newTheme === "dark");
			}

			if (changes["aura-locale"]) {
				const newLocale = changes["aura-locale"].newValue as "en" | "zh-CN";
				setLocale(newLocale);
				changeLocale(newLocale);
			}
		};

		chrome.storage.onChanged.addListener(handleStorageChange);
		return () => chrome.storage.onChanged.removeListener(handleStorageChange);
	}, [setThemeMode, setLocale]);

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

	useHotkey("shift+/", (event) => {
		event.preventDefault();
		setIsShortcutsOpen(true);
	});

	useHotkey("mod+h", (event) => {
		event.preventDefault();
		setIsHistoryOpen(true);
	});

	if (isLoading) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4 bg-cloud-50 dark:bg-slate-950">
				<div className="flex flex-col items-center gap-3">
					<div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
					<div className="text-base font-medium text-cloud-600 dark:text-cloud-400">
						{loadingMessage || m.dashboard_loading()}
					</div>
					{loadingStage !== "ready" && (
						<div className="text-sm text-cloud-500 dark:text-cloud-500">
							{loadingStage === "initializing" && "Initializing application..."}
							{loadingStage === "loading-db" && "Loading your workspaces..."}
							{loadingStage === "loading-user" && "Loading user profile..."}
							{loadingStage === "syncing" && "Syncing with server..."}
						</div>
					)}
				</div>
			</div>
		);
	}

	const userLabel = currentUser
		? (currentUser.name ?? currentUser.email)
		: null;

	const workspaceCollections = collections
		.filter((c) => c.workspaceId === activeWorkspaceId)
		.sort((a, b) => a.order - b.order);

	const workspaceCollectionIds = new Set(workspaceCollections.map((c) => c.id));
	const workspaceTabs = tabs.filter((t) =>
		workspaceCollectionIds.has(t.collectionId),
	);
	const workspaceTabsCount = workspaceTabs.length;

	const getWorkspaceUrlsInDisplayOrder = () => {
		const urls: string[] = [];
		for (const col of workspaceCollections) {
			const collectionTabs = tabs.filter((t) => t.collectionId === col.id);
			const sortedTabs = [...collectionTabs].sort((a, b) => {
				const aPinned = !!a.isPinned;
				const bPinned = !!b.isPinned;
				if (aPinned !== bPinned) return aPinned ? -1 : 1;

				if (a.order !== b.order) return a.order - b.order;

				const aTime = a.updatedAt ?? a.createdAt ?? 0;
				const bTime = b.updatedAt ?? b.createdAt ?? 0;
				if (aTime !== bTime) return bTime - aTime;

				return 0;
			});
			for (const tab of sortedTabs) {
				if (tab.url) urls.push(tab.url);
			}
		}
		return urls;
	};

	return (
		<div className="relative flex h-screen bg-cloud-50 dark:bg-slate-950 overflow-hidden">
			{/* Skip to main content link for keyboard navigation */}
			<a href="#main-content" className="skip-to-main">
				Skip to main content
			</a>

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
					onOpenShortcuts={() => setIsShortcutsOpen(true)}
					onOpenHistory={() => setIsHistoryOpen(true)}
					workspaceTabsCount={workspaceTabsCount}
					workspaceCollectionsCount={workspaceCollections.length}
					getWorkspaceUrlsInDisplayOrder={getWorkspaceUrlsInDisplayOrder}
					workspaceRestoreConfirmThreshold={WORKSPACE_RESTORE_CONFIRM_THRESHOLD}
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
				activeWorkspaceId={activeWorkspaceId}
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
			<KeyboardShortcutsDialog
				isOpen={isShortcutsOpen}
				onClose={() => setIsShortcutsOpen(false)}
			/>
			<HistoryDrawer
				isOpen={isHistoryOpen}
				onClose={() => setIsHistoryOpen(false)}
			/>
			<OfflineIndicator />
		</div>
	);
}
