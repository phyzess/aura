import { useSetAtom } from "jotai";
import { Pencil, Plus, RotateCw, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
	createWorkspaceAtom,
	deleteWorkspaceAtom,
	importTobyDataAtom,
	updateWorkspaceNameAtom,
} from "@/store/actions";
import { activeWorkspaceIdAtom } from "@/store/atoms";
import type { Collection, TabItem, Workspace } from "@/types";
import { AuraLogo } from "./AuraLogo";
import { ConfirmModal } from "./ConfirmModal";
import { ImportModal } from "./ImportModal";

interface SidebarProps {
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
	activeWorkspaceId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
	workspaces,
	collections,
	/* tabs, */
	activeWorkspaceId,
}) => {
	const setActiveWorkspaceId = useSetAtom(activeWorkspaceIdAtom);
	const createWorkspace = useSetAtom(createWorkspaceAtom);
	const updateWorkspaceName = useSetAtom(updateWorkspaceNameAtom);
	const deleteWorkspace = useSetAtom(deleteWorkspaceAtom);
	const importTobyData = useSetAtom(importTobyDataAtom);

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
		const newWorkspace = await createWorkspace("New Space");
		if (newWorkspace) {
			setEditingId(newWorkspace.id);
			setEditName("New Space");
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
						title="My Spaces"
						action={
							<div className="flex items-center gap-2">
								<IconButton
									onClick={handleCreateWorkspace}
									variant="accent"
									size="sm"
									aria-label="Create new space"
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
												title="Rename"
												aria-label="Rename space"
												className="text-current"
											>
												<Pencil size={12} />
											</IconButton>
											<IconButton
												type="button"
												onClick={() => handleDeleteClick(ws.id)}
												variant="danger"
												size="sm"
												title="Delete"
												aria-label="Delete space"
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
					<div className="bg-surface-muted p-1 rounded-2xl flex flex-col gap-1">
						<div className="flex gap-1">
							<button
								type="button"
								onClick={() => setIsImportModalOpen(true)}
								title="Import Data"
								className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-secondary bg-surface-elevated hover:bg-surface-elevated/90 hover:shadow-sm rounded-xl transition-all"
							>
								<UploadCloud size={14} />
								<span>Import</span>
							</button>
							<button
								type="button"
								title="Sync Data"
								className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-secondary bg-surface-elevated hover:bg-surface-elevated/90 hover:shadow-sm rounded-xl transition-all"
							>
								<RotateCw size={14} />
								<span>Sync</span>
							</button>
						</div>
					</div>
				</div>
			</Card>

			<ConfirmModal
				isOpen={deleteConfirmation.isOpen}
				title="Delete Space?"
				message="This will permanently delete this space and all its collections. This action cannot be undone."
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
