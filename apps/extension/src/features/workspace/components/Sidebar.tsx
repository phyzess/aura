import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useAtomValue, useSetAtom } from "jotai";
import { Download, Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AuraLogo, ConfirmModal } from "@/components/shared";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HStack } from "@/components/ui/Stack";
import { errorLogger } from "@/config/logger";
import {
	activeWorkspaceIdAtom,
	createWorkspaceAtom,
	deleteWorkspaceAtom,
	exportAllDataAtom,
	exportWorkspaceAtom,
	importTobyDataAtom,
	lastSyncTimestampAtom,
	syncErrorAtom,
	syncLastSourceAtom,
	syncStatusAtom,
	syncWithServerAtom,
	updateWorkspaceNameAtom,
} from "@/features";
import { User } from "@/features/auth/components";
import { ImportModal } from "@/features/import/components";
import * as m from "@/paraglide/messages";
import type { Collection, TabItem, Workspace } from "@/types";

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
	const lastSyncTimestamp = useAtomValue(lastSyncTimestampAtom);
	const setActiveWorkspaceId = useSetAtom(activeWorkspaceIdAtom);
	const createWorkspace = useSetAtom(createWorkspaceAtom);
	const updateWorkspaceName = useSetAtom(updateWorkspaceNameAtom);
	const deleteWorkspace = useSetAtom(deleteWorkspaceAtom);
	const importTobyData = useSetAtom(importTobyDataAtom);
	const exportAllData = useSetAtom(exportAllDataAtom);
	const exportWorkspace = useSetAtom(exportWorkspaceAtom);
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

	const [workspaceListRef] = useAutoAnimate({
		duration: 150,
	});

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
		setActiveWorkspaceId(ws.id);
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

	return (
		<div className="w-72 p-4 flex flex-col z-20 h-full">
			<Card
				variant="glass"
				radius="4xl"
				className="flex-1 flex flex-col backdrop-blur-xl overflow-hidden"
			>
				<CardHeader className="p-6 pb-2 flex-col items-stretch gap-6 shrink-0">
					<HStack className="mb-8">
						<div className="w-10 h-10 relative shrink-0">
							<AuraLogo className="w-full h-full drop-shadow-md transform hover:scale-110 transition-transform duration-300" />
						</div>
						<div>
							<h1 className="font-bold text-xl text-primary tracking-tight leading-none">
								Aura
							</h1>
						</div>
					</HStack>

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
				</CardHeader>

				<CardBody className="flex-1 overflow-y-auto px-4 pb-2 custom-scrollbar min-h-0">
					<div ref={workspaceListRef} className="space-y-2">
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
													onClick={() => {
														try {
															exportWorkspace(ws.id);
															toast.success(
																m.sidebar_workspace_export_success_toast(),
															);
														} catch (error) {
															errorLogger.error("Export workspace failed", {
																error,
															});
															if (
																error instanceof Error &&
																error.message === "NO_DATA_TO_EXPORT"
															) {
																toast.error(m.workspace_export_no_data_error());
															} else {
																toast.error(
																	m.sidebar_workspace_export_error_toast(),
																);
															}
														}
													}}
													variant="subtle"
													size="sm"
													title={m.sidebar_workspace_export_title()}
													aria-label={m.sidebar_workspace_export_aria()}
													className="text-current"
												>
													<Download size={12} />
												</IconButton>
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
				</CardBody>

				<div className="p-4 pt-2 shrink-0">
					<div className="bg-surface-muted p-1 rounded-2xl flex flex-col gap-1">
						<div className="flex gap-1">
							<Button
								onClick={() => setIsImportModalOpen(true)}
								title={m.sidebar_import_button_title()}
								variant="secondary"
								size="sm"
								className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-secondary bg-surface-elevated hover:bg-surface-elevated hover:shadow-[0_0_16px_-2px_var(--color-accent-soft)] hover:scale-[1.02] rounded-xl transition-all duration-200 cursor-pointer"
							>
								<UploadCloud size={14} />
								<span>{m.sidebar_import_button_label()}</span>
							</Button>
							<Button
								onClick={() => {
									try {
										exportAllData();
										toast.success("Data exported successfully");
									} catch (error) {
										errorLogger.error("Export all data failed", { error });
										if (
											error instanceof Error &&
											error.message === "NO_DATA_TO_EXPORT"
										) {
											toast.error(m.export_all_no_data_error());
										} else {
											toast.error("Export failed. Please try again.");
										}
									}
								}}
								title={m.sidebar_export_button_title()}
								variant="secondary"
								size="sm"
								className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-secondary bg-surface-elevated hover:bg-surface-elevated hover:shadow-[0_0_16px_-2px_var(--color-accent-soft)] hover:scale-[1.02] rounded-xl transition-all duration-200 cursor-pointer"
							>
								<Download size={14} />
								<span>{m.sidebar_export_button_label()}</span>
							</Button>
						</div>
						<User
							currentUserEmail={currentUserEmail}
							onOpenAuth={onOpenAuth}
							onSignOut={onSignOut}
							syncStatus={syncStatus}
							lastSyncTimestamp={lastSyncTimestamp}
							onSync={syncWithServer}
						/>
					</div>
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
				) => {
					try {
						await importTobyData({
							data: JSON.parse(content),
							targetWorkspaceId: targetWsId,
							newWorkspaceName: newWsName,
							targetCollectionId: targetColId,
							newCollectionName: newColName,
						});
						toast.success(m.sidebar_import_success_toast());
					} catch (error) {
						errorLogger.error("Import failed", { error });
						toast.error(m.sidebar_import_error_toast());
					}
				}}
			/>
		</div>
	);
};
