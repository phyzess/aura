import { useSetAtom } from "jotai";
import { ExternalLink } from "lucide-react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { useTabSearch } from "@/hooks/useTabSearch";
import * as m from "@/paraglide/messages";
import { clearLocalDataAtom, signOutAtom } from "@/store/actions";
import { ChromeService } from "../../services/chrome";
import type { Collection, TabItem, User, Workspace } from "../../types";
import { ExtensionPopupAuthDrawer } from "./ExtensionPopupAuthDrawer";
import { ExtensionPopupHeader } from "./ExtensionPopupHeader";
import { ExtensionPopupLogoutDrawer } from "./ExtensionPopupLogoutDrawer";
import { ExtensionPopupMainContent } from "./ExtensionPopupMainContent";
import { ExtensionPopupSaveDrawer } from "./ExtensionPopupSaveDrawer";

interface ExtensionPopupProps {
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
	currentUser: User | null;
	onCapture: (payload: any) => void;
	onClose: () => void;
}

type ViewLevel = "workspaces" | "collections" | "tabs";

export const ExtensionPopup: React.FC<ExtensionPopupProps> = ({
	workspaces,
	collections,
	tabs,
	currentUser,
	onCapture,
	onClose,
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
	} = useTabSearch({ tabs });
	const inputRef = useRef<HTMLInputElement>(null);
	const signOut = useSetAtom(signOutAtom);
	const clearLocalData = useSetAtom(clearLocalDataAtom);

	// --- SAVE SESSION DRAWER STATE ---
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false);
	const [isLogoutDrawerOpen, setIsLogoutDrawerOpen] = useState(false);
	const [sessionTabs, setSessionTabs] = useState<Partial<TabItem>[]>([]);
	const [checkedTabs, setCheckedTabs] = useState<Set<number>>(new Set());

	// Save Form State
	const [targetWsId, setTargetWsId] = useState<string>("new");
	const [newWsName, setNewWsName] = useState<string>(
		m.popup_save_drawer_default_workspace_name(),
	);
	const [targetColId, setTargetColId] = useState<string>("new");
	const [newColName, setNewColName] = useState("");

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

		onCapture({
			tabs: finalTabs,
			targetWorkspaceId: targetWsId,
			newWorkspaceName: targetWsId === "new" ? newWsName : undefined,
			targetCollectionId: targetColId,
			newCollectionName: targetColId === "new" ? newColName : undefined,
		});
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
			label: "Aura",
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
				<button
					type="button"
					onClick={onClose}
					className="inline-flex items-center gap-1 text-[11px] text-secondary hover:text-accent hover:underline underline-offset-2 transition-colors"
				>
					<span>{m.popup_footer_open_dashboard_label()}</span>
					<ExternalLink size={10} />
				</button>
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
