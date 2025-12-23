import { useAtomValue, useSetAtom } from "jotai";
import { LogIn, Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";
import * as m from "@/paraglide/messages";
import {
	createWorkspaceAtom,
	deleteWorkspaceAtom,
	importTobyDataAtom,
	syncWithServerAtom,
	updateWorkspaceNameAtom,
} from "@/store/actions";
import {
	activeWorkspaceIdAtom,
	syncErrorAtom,
	syncLastSourceAtom,
	syncStatusAtom,
} from "@/store/atoms";
import type { Collection, TabItem, Workspace } from "@/types";
import { AuraLogo } from "./AuraLogo";
import { ConfirmModal } from "./ConfirmModal";
import { ImportModal } from "./ImportModal";
import { User } from "./User";

interface SidebarProps {
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
	activeWorkspaceId: string | null;
	currentUserEmail?: string | null;
	onOpenAuth?: () => void;
	onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
	workspaces,
	collections,
	/* tabs, */
	activeWorkspaceId,
	currentUserEmail,
	onOpenAuth,
	onSignOut,
}) => {
	const syncStatus = useAtomValue(syncStatusAtom);
	const syncError = useAtomValue(syncErrorAtom);
	const syncLastSource = useAtomValue(syncLastSourceAtom);
	const setActiveWorkspaceId = useSetAtom(activeWorkspaceIdAtom);
	const createWorkspace = useSetAtom(createWorkspaceAtom);
	const updateWorkspaceName = useSetAtom(updateWorkspaceNameAtom);
	const deleteWorkspace = useSetAtom(deleteWorkspaceAtom);
	const importTobyData = useSetAtom(importTobyDataAtom);
	const syncWithServer = useSetAtom(syncWithServerAtom);

	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const [isImportModalOpen, setIsImportModalOpen] = useState(false);

	const [deleteConfirmation, setDeleteConfirmation] = useState<{
		isOpen: boolean;
		id: string | null;
	}>({
		isOpen: false,
		id: null,
	});

	const clickStateRef = useRef<{
		id: string;
		timer: ReturnType<typeof setTimeout>;
	} | null>(null);

	const startEditing = (ws: Workspace) => {
		setEditingId(ws.id);
		setEditName(ws.name);
	};

	const saveEditing = () => {
		if (editingId && editName.trim()) {
			updateWorkspaceName({ id: editingId, name: editName.trim() });
		}
		setEditingId(null);
	};

	const handleCreateWorkspace = async () => {
		const defaultName = m.sidebar_new_workspace_default_name();
		const newWorkspace = await createWorkspace(defaultName);
		if (newWorkspace) {
			setEditingId(newWorkspace.id);
			setEditName(defaultName);
		}
	};

	const handleDeleteClick = (id: string) => {
		setDeleteConfirmation({ isOpen: true, id });
	};

	const handleConfirmDelete = () => {
		if (deleteConfirmation.id) {
			deleteWorkspace(deleteConfirmation.id);
		}
	};

	const handleWorkspaceClick = (ws: Workspace) => {
		if (editingId === ws.id) return;

		if (clickStateRef.current && clickStateRef.current.id === ws.id) {
			clearTimeout(clickStateRef.current.timer);
			clickStateRef.current = null;
			startEditing(ws);
		} else {
			if (clickStateRef.current) {
				clearTimeout(clickStateRef.current.timer);
			}

			const timer = setTimeout(() => {
				setActiveWorkspaceId(ws.id);
				clickStateRef.current = null;
			}, 200);

			clickStateRef.current = { id: ws.id, timer };
		}
	};

	useEffect(() => {
		if (editingId && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [editingId]);

	useEffect(() => {
		if (syncStatus === "success" && syncLastSource === "manual") {
			toast.success(m.sidebar_sync_success_toast());
		} else if (syncStatus === "error" && syncError) {
			toast.error(syncError);
		}
	}, [syncStatus, syncError, syncLastSource]);

	useEffect(() => {
		return () => {
			if (clickStateRef.current) {
				clearTimeout(clickStateRef.current.timer);
			}
		};
	}, []);

	return (
		<div className="w-72 p-4 flex flex-col z-20 h-full">
			<Card variant="glass" className="flex-1 rounded-4xl backdrop-blur-xl">
				<div className="p-6 pb-2">
					<div className="flex items-center gap-3 mb-8">
						<div className="w-10 h-10 relative shrink-0">
							<AuraLogo className="w-full h-full drop-shadow-md transform hover:scale-110 transition-transform duration-300" />
						</div>
						<div>
							<h1 className="font-bold text-xl text-primary tracking-tight leading-none">
								Aura
							</h1>
						</div>
					</div>

					<SectionHeader
						title={m.sidebar_my_spaces_title()}
						action={
							<div className="flex items-center gap-2">
								<IconButton
									onClick={handleCreateWorkspace}
									variant="accent"
									size="sm"
									aria-label={m.sidebar_create_space_aria()}
								>
									<Plus size={14} />
								</IconButton>
							</div>
						}
					/>
				</div>

				<div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
					{workspaces.map((ws) => (
						<div
							key={ws.id}
							className={`group w-full px-4 py-3 rounded-2xl text-body font-semibold transition-all duration-200 flex items-center justify-between cursor-pointer border ${
								activeWorkspaceId === ws.id
									? "bg-surface-elevated border-surface-border text-primary shadow-soft translate-x-1"
									: "border-transparent text-secondary hover:bg-surface-muted hover:text-accent"
							}`}
							onClick={() => handleWorkspaceClick(ws)}
						>
							{editingId === ws.id ? (
								<Input
									ref={inputRef}
									type="text"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									onBlur={saveEditing}
									onKeyDown={(e) => e.key === "Enter" && saveEditing()}
									className="truncate flex-1 text-inherit font-semibold h-6"
									onClick={(e) => e.stopPropagation()}
								/>
							) : (
								<>
									<span className="truncate flex-1">{ws.name}</span>
									<div
										className="flex items-center gap-1"
										onClick={(e) => e.stopPropagation()}
										onMouseDown={(e) => e.stopPropagation()}
									>
										<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative z-10">
											<IconButton
												type="button"
												onClick={() => startEditing(ws)}
												variant="subtle"
												size="sm"
												title={m.sidebar_workspace_rename_title()}
												aria-label={m.sidebar_workspace_rename_aria()}
												className="text-current"
											>
												<Pencil size={12} />
											</IconButton>
											<IconButton
												type="button"
												onClick={() => handleDeleteClick(ws.id)}
												variant="danger"
												size="sm"
												title={m.sidebar_workspace_delete_title()}
												aria-label={m.sidebar_workspace_delete_aria()}
											>
												<Trash2 size={12} />
											</IconButton>
										</div>
									</div>
								</>
							)}
						</div>
					))}
				</div>

				<div className="p-4 mt-2 bg-linear-to-b from-transparent to-surface-muted/60">
					<div className="bg-surface-muted p-1 rounded-2xl flex gap-1">
						<button
							type="button"
							onClick={() => setIsImportModalOpen(true)}
							title={m.sidebar_import_button_title()}
							className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-secondary bg-surface-elevated hover:bg-surface-elevated/90 hover:shadow-sm rounded-l-xl transition-all cursor-pointer"
						>
							<UploadCloud size={14} />
							<span>{m.sidebar_import_button_label()}</span>
						</button>
						<User
							currentUserEmail={currentUserEmail}
							onOpenAuth={onOpenAuth}
							onSignOut={onSignOut}
						/>
					</div>
					{!currentUserEmail ? (
						<div className="mt-2 px-3 text-xs text-center text-primary/60">
							{m.sidebar_login_prompt()}
						</div>
					) : (
						<button
							type="button"
							onClick={() => syncWithServer({ source: "manual" })}
							disabled={syncStatus === "syncing"}
							className={`mt-2 w-full px-3 py-1 text-xs text-center transition-colors ${
								syncStatus === "error"
									? "text-danger hover:text-danger/80 cursor-pointer"
									: syncStatus === "syncing"
										? "text-green/50 cursor-not-allowed"
										: "text-green-600/80 hover:text-green-600 cursor-pointer"
							}`}
						>
							{syncStatus === "idle" || syncStatus === "success"
								? m.sidebar_sync_status_synced()
								: syncStatus === "syncing"
									? m.sidebar_sync_status_syncing()
									: m.sidebar_sync_status_error()}
						</button>
					)}
				</div>
			</Card>

			<ConfirmModal
				isOpen={deleteConfirmation.isOpen}
				title={m.sidebar_delete_space_modal_title()}
				message={m.sidebar_delete_space_modal_message()}
				onConfirm={handleConfirmDelete}
				onClose={() =>
					setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })
				}
			/>

			<ImportModal
				isOpen={isImportModalOpen}
				onClose={() => setIsImportModalOpen(false)}
				workspaces={workspaces}
				collections={collections}
				onImport={async (
					content,
					targetWsId,
					newWsName,
					targetColId,
					newColName,
				) =>
					importTobyData({
						data: JSON.parse(content),
						targetWorkspaceId: targetWsId,
						newWorkspaceName: newWsName,
						targetCollectionId: targetColId,
						newCollectionName: newColName,
					})
				}
			/>
		</div>
	);
};
