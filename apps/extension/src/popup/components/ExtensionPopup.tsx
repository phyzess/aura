import { useSetAtom } from "jotai";
import { ExternalLink } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { useTabSearch } from "@/hooks/useTabSearch";
import * as m from "@/paraglide/messages";
import { clearLocalDataAtom, signOutAtom } from "@/store/actions";
import { ChromeService } from "../../services/chrome";
import type {
	Collection,
	SessionTab,
	TabItem,
	User,
	Workspace,
} from "../../types";
import { ExtensionPopupAuthDrawer } from "./ExtensionPopupAuthDrawer";
import { ExtensionPopupHeader } from "./ExtensionPopupHeader";
import { ExtensionPopupLogoutDrawer } from "./ExtensionPopupLogoutDrawer";
import { ExtensionPopupMainContent } from "./ExtensionPopupMainContent";
import { ExtensionPopupSaveDrawer } from "./ExtensionPopupSaveDrawer";

interface SaveRequest {
	mode: "current-tab" | "link" | "all-tabs";
	timestamp: number;
	data?: {
		url?: string;
		title?: string;
		favicon?: string;
	};
}

interface ExtensionPopupProps {
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
	currentUser: User | null;
	onCapture: (payload: any) => void;
	onClose: () => void;
	saveRequest?: SaveRequest | null;
}

type ViewLevel = "workspaces" | "collections" | "tabs";

export const ExtensionPopup: React.FC<ExtensionPopupProps> = ({
	workspaces,
	collections,
	tabs,
	currentUser,
	onCapture,
	onClose,
	saveRequest,
}) => {
	const [viewLevel, setViewLevel] = useState<ViewLevel>("workspaces");
	const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
		null,
	);
	const [selectedCollectionId, setSelectedCollectionId] = useState<
		string | null
	>(null);

	// Search State
	const {
		query: searchQuery,
		setQuery: setSearchQuery,
		results: searchResults,
		clear: clearSearch,
	} = useTabSearch({
		tabs,
		collections,
	});
	const inputRef = useRef<HTMLInputElement>(null);
	const signOut = useSetAtom(signOutAtom);
	const clearLocalData = useSetAtom(clearLocalDataAtom);

	// --- SAVE SESSION DRAWER STATE ---
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false);
	const [isLogoutDrawerOpen, setIsLogoutDrawerOpen] = useState(false);
	const [sessionTabs, setSessionTabs] = useState<SessionTab[]>([]);
	const [checkedTabs, setCheckedTabs] = useState<Set<number>>(new Set());
	const [closeTabsAfterSave, setCloseTabsAfterSave] = useState(false);

	// Save Form State
	const [targetWsId, setTargetWsId] = useState<string>("new");
	const [newWsName, setNewWsName] = useState<string>(
		m.popup_save_drawer_default_workspace_name(),
	);
	const [targetColId, setTargetColId] = useState<string>("new");
	const [newColName, setNewColName] = useState("");

	// Handle save request from context menu
	useEffect(() => {
		if (saveRequest) {
			handleSaveRequestFromContextMenu(saveRequest);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [saveRequest]);

	// Derived Data

	const nonEmptyWorkspaces = useMemo(() => {
		return workspaces.filter((ws) =>
			collections.some((c) => c.workspaceId === ws.id),
		);
	}, [workspaces, collections]);

	const currentCollections = useMemo(() => {
		if (!selectedWorkspaceId) return [];
		return collections
			.filter((c) => c.workspaceId === selectedWorkspaceId)
			.sort((a, b) => a.order - b.order);
	}, [collections, selectedWorkspaceId]);

	const currentTabs = useMemo(() => {
		if (!selectedCollectionId) return [];
		return tabs
			.filter((t) => t.collectionId === selectedCollectionId)
			.sort((a, b) => a.order - b.order);
	}, [tabs, selectedCollectionId]);

	// Handlers
	const handleWorkspaceClick = (wsId: string) => {
		setSelectedWorkspaceId(wsId);
		setViewLevel("collections");
	};

	const handleCollectionClick = (colId: string) => {
		setSelectedCollectionId(colId);
		setViewLevel("tabs");
	};

	const handleClearSearch = () => {
		clearSearch();
		inputRef.current?.focus();
	};

	// --- DRAWER HANDLERS ---

	const handleOpenSaveDrawer = async () => {
		setCloseTabsAfterSave(false);
		const tabs = await ChromeService.getCurrentTabs();
		setSessionTabs(tabs);

		const allIndexes = new Set(tabs.map((_, i) => i));
		setCheckedTabs(allIndexes);

		if (selectedWorkspaceId) {
			setTargetWsId(selectedWorkspaceId);
			setTargetColId("new");
		} else if (workspaces.length > 0) {
			setTargetWsId(workspaces[0].id);
			setTargetColId("new");
		} else {
			setTargetWsId("new");
			setTargetColId("new");
		}

		setNewColName(
			`Session ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
		);

		setIsDrawerOpen(true);
	};

	const handleConfirmSave = () => {
		const finalTabs = sessionTabs.filter((_, i) => checkedTabs.has(i));
		const tabIdsToClose = closeTabsAfterSave
			? finalTabs
					.map((tab) => tab.chromeTabId)
					.filter((id): id is number => typeof id === "number")
			: [];

		onCapture({
			tabs: finalTabs,
			targetWorkspaceId: targetWsId,
			newWorkspaceName: targetWsId === "new" ? newWsName : undefined,
			targetCollectionId: targetColId,
			newCollectionName: targetColId === "new" ? newColName : undefined,
		});

		if (closeTabsAfterSave && tabIdsToClose.length > 0) {
			void ChromeService.closeTabsById(tabIdsToClose).catch((error: any) => {
				console.error("Failed to close some tabs after saving:", error);
				toast.error(m.popup_close_tabs_error());
			});
		}

		setIsDrawerOpen(false);
	};

	const handleOpenAuthDrawer = () => {
		setIsAuthDrawerOpen(true);
	};

	const handleOpenLogoutDrawer = () => {
		setIsLogoutDrawerOpen(true);
	};

	const handleConfirmLogout = async ({
		clearLocalData: shouldClear,
	}: {
		clearLocalData: boolean;
	}) => {
		const ok = await signOut();
		if (!ok) return;
		if (shouldClear) {
			await clearLocalData();
		}
		setIsLogoutDrawerOpen(false);
	};

	const handleSaveRequestFromContextMenu = async (request: SaveRequest) => {
		if (request.mode === "current-tab" && request.data) {
			// Save single tab
			const tab: SessionTab = {
				url: request.data.url || "",
				title: request.data.title || m.popup_save_untitled_tab_title(),
				faviconUrl: request.data.favicon,
			};
			setSessionTabs([tab]);
			setCheckedTabs(new Set([0]));
		} else if (request.mode === "link" && request.data) {
			// Save link
			const tab: SessionTab = {
				url: request.data.url || "",
				title: request.data.title || m.popup_save_untitled_tab_title(),
				faviconUrl: request.data.favicon,
			};
			setSessionTabs([tab]);
			setCheckedTabs(new Set([0]));
		} else if (request.mode === "all-tabs") {
			// Save all tabs
			const allTabs = await ChromeService.getCurrentTabs();
			setSessionTabs(allTabs);
			setCheckedTabs(new Set(allTabs.map((_, i) => i)));
		}

		// Set default workspace and collection
		if (selectedWorkspaceId) {
			setTargetWsId(selectedWorkspaceId);
			setTargetColId("new");
		} else if (workspaces.length > 0) {
			setTargetWsId(workspaces[0].id);
			setTargetColId("new");
		} else {
			setTargetWsId("new");
			setTargetColId("new");
		}

		setNewColName(
			`Session ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
		);

		// Open the save drawer
		setIsDrawerOpen(true);
	};

	// Options for Drawer Selects
	const wsOptions = useMemo(() => {
		const existing = workspaces.map((w) => ({ value: w.id, label: w.name }));
		return [
			...existing,
			{ value: "new", label: m.popup_save_drawer_ws_option_new_space() },
		];
	}, [workspaces]);

	const colOptions = useMemo(() => {
		if (targetWsId === "new")
			return [
				{
					value: "new",
					label: m.popup_save_drawer_col_option_new_collection(),
				},
			];
		const cols = collections.filter((c) => c.workspaceId === targetWsId);
		const existing = cols.map((c) => ({ value: c.id, label: c.name }));
		return [
			{
				value: "new",
				label: m.popup_save_drawer_col_option_new_collection(),
			},
			...existing,
		];
	}, [collections, targetWsId]);

	// -- Breadcrumb Items Logic --
	const breadcrumbs = useMemo(() => {
		if (searchQuery) {
			return [{ label: m.popup_breadcrumb_search_results() }];
		}

		const items: {
			label: string;
			onClick?: () => void;
			isCurrent?: boolean;
		}[] = [];

		items.push({
			label: m.popup_breadcrumb_home(),
			onClick:
				viewLevel !== "workspaces"
					? () => {
							setViewLevel("workspaces");
							setSelectedWorkspaceId(null);
							setSelectedCollectionId(null);
						}
					: undefined,
		});

		if (viewLevel === "workspaces") {
			items.push({
				label: m.popup_breadcrumb_workspaces_title(),
				isCurrent: true,
			});
			return items;
		}

		if (viewLevel === "collections") {
			const ws = workspaces.find((w) => w.id === selectedWorkspaceId);
			if (ws) {
				items.push({ label: ws.name, isCurrent: true });
			} else {
				items.push({
					label: m.popup_breadcrumb_collections_fallback(),
					isCurrent: true,
				});
			}
			return items;
		}

		if (viewLevel === "tabs") {
			const ws = workspaces.find((w) => w.id === selectedWorkspaceId);
			const col = collections.find((c) => c.id === selectedCollectionId);

			if (ws) {
				items.push({
					label: ws.name,
					onClick: () => {
						setViewLevel("collections");
						setSelectedWorkspaceId(ws.id);
						setSelectedCollectionId(null);
					},
				});
			}

			if (col) {
				items.push({ label: col.name, isCurrent: true });
			} else {
				items.push({
					label: m.popup_breadcrumb_tabs_fallback(),
					isCurrent: true,
				});
			}

			return items;
		}

		return items;
	}, [
		searchQuery,
		viewLevel,
		workspaces,
		collections,
		selectedWorkspaceId,
		selectedCollectionId,
	]);

	const userLabel = currentUser
		? (currentUser.name ?? currentUser.email)
		: undefined;

	return (
		<div className="w-90 h-130 bg-surface flex flex-col overflow-hidden relative font-sans shadow-soft">
			<ExtensionPopupHeader
				searchQuery={searchQuery}
				breadcrumbs={breadcrumbs}
				currentUserEmail={userLabel}
				onOpenAuth={handleOpenAuthDrawer}
				onSignOut={handleOpenLogoutDrawer}
				onOpenSaveDrawer={handleOpenSaveDrawer}
				onSearchChange={setSearchQuery}
				onClearSearch={handleClearSearch}
				inputRef={inputRef}
			/>

			<ExtensionPopupMainContent
				viewLevel={viewLevel}
				searchQuery={searchQuery}
				searchResults={searchResults}
				nonEmptyWorkspaces={nonEmptyWorkspaces}
				currentCollections={currentCollections}
				currentTabs={currentTabs}
				workspaces={workspaces}
				collections={collections}
				tabs={tabs}
				onWorkspaceClick={handleWorkspaceClick}
				onCollectionClick={handleCollectionClick}
			/>

			<div className="px-5 pb-4 text-[11px] text-secondary text-right">
				<Button
					type="button"
					onClick={onClose}
					variant="link"
					size="sm"
					className="text-[11px]"
				>
					<span>{m.popup_footer_open_dashboard_label()}</span>
					<ExternalLink size={10} />
				</Button>
			</div>

			<ExtensionPopupSaveDrawer
				isOpen={isDrawerOpen}
				sessionTabs={sessionTabs}
				checkedTabs={checkedTabs}
				wsOptions={wsOptions}
				colOptions={colOptions}
				targetWsId={targetWsId}
				targetColId={targetColId}
				newWsName={newWsName}
				newColName={newColName}
				closeTabsAfterSave={closeTabsAfterSave}
				onClose={() => setIsDrawerOpen(false)}
				onToggleTab={(index) => {
					const next = new Set(checkedTabs);
					if (next.has(index)) next.delete(index);
					else next.add(index);
					setCheckedTabs(next);
				}}
				onToggleAllTabs={() => {
					if (checkedTabs.size === sessionTabs.length)
						setCheckedTabs(new Set());
					else setCheckedTabs(new Set(sessionTabs.map((_, i) => i)));
				}}
				onChangeWorkspace={(id) => setTargetWsId(id)}
				onChangeCollection={(id) => setTargetColId(id)}
				onChangeNewWorkspaceName={setNewWsName}
				onChangeNewCollectionName={setNewColName}
				onToggleCloseTabsAfterSave={() =>
					setCloseTabsAfterSave((prev) => !prev)
				}
				onConfirmSave={handleConfirmSave}
			/>
			<ExtensionPopupAuthDrawer
				isOpen={isAuthDrawerOpen}
				onClose={() => setIsAuthDrawerOpen(false)}
			/>
			<ExtensionPopupLogoutDrawer
				isOpen={isLogoutDrawerOpen}
				onClose={() => setIsLogoutDrawerOpen(false)}
				onConfirm={handleConfirmLogout}
			/>
		</div>
	);
};
