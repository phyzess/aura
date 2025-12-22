import { useAtomValue, useSetAtom } from "jotai";
import { Plus, Stars } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import * as m from "@/paraglide/messages";
import {
	addCollectionAtom,
	addTabAtom,
	createWorkspaceAtom,
	deleteCollectionAtom,
	deleteTabAtom,
	updateCollectionNameAtom,
} from "@/store/actions";
import { workspacesAtom } from "@/store/atoms";
import { activeWorkspaceAtom } from "@/store/selectors";
import type { Collection, TabItem } from "@/types";
import { AddTabModal } from "./AddTabModal";
import { CollectionColumn } from "./CollectionColumn";

interface WorkspaceViewProps {
	workspaceId: string | null;
	collections: Collection[];
	tabs: TabItem[];
	focusedTabId?: string | null;
	onHighlightComplete?: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
	workspaceId: _workspaceId,
	collections,
	tabs,
	focusedTabId,
	onHighlightComplete,
}) => {
	const workspaces = useAtomValue(workspacesAtom);
	const workspace = useAtomValue(activeWorkspaceAtom);

	const createWorkspace = useSetAtom(createWorkspaceAtom);
	const addCollection = useSetAtom(addCollectionAtom);
	const updateCollectionName = useSetAtom(updateCollectionNameAtom);
	const deleteCollection = useSetAtom(deleteCollectionAtom);
	const addTab = useSetAtom(addTabAtom);
	const deleteTab = useSetAtom(deleteTabAtom);

	const [isCreatingCollection, setIsCreatingCollection] = useState(false);
	const [newColName, setNewColName] = useState("");

	const [addTabModal, setAddTabModal] = useState<{
		isOpen: boolean;
		collectionId: string | null;
	}>({
		isOpen: false,
		collectionId: null,
	});

	const [highlightedTabId, setHighlightedTabId] = useState<string | null>(null);

	useEffect(() => {
		if (!focusedTabId) return;

		setHighlightedTabId(focusedTabId);

		const el = document.getElementById(`tab-${focusedTabId}`);
		if (el && "scrollIntoView" in el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
		}

		const timer = window.setTimeout(() => {
			setHighlightedTabId(null);
			onHighlightComplete?.();
		}, 3000);

		return () => window.clearTimeout(timer);
	}, [focusedTabId, onHighlightComplete]);

	if (workspaces.length === 0) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-surface">
				<div className="z-10 bg-surface-glass backdrop-blur-xl p-12 rounded-[3rem] shadow-soft border border-surface flex flex-col items-center max-w-lg text-center">
					<div className="flex items-center gap-2 mb-3 text-accent">
						<Stars size={16} />
						<span className="text-xs font-bold uppercase tracking-wider text-secondary">
							{m.workspace_getting_started_badge()}
						</span>
					</div>
					<h2 className="text-3xl font-bold text-primary mb-4">
						{m.workspace_empty_all_title()}
					</h2>
					<p className="text-secondary mb-8 leading-relaxed text-lg">
						{m.workspace_empty_all_body()}
					</p>
					<Button
						type="button"
						onClick={() =>
							createWorkspace(m.workspace_empty_all_default_workspace_name())
						}
						size="lg"
					>
						<Plus size={24} strokeWidth={3} />
						{m.workspace_empty_all_button()}
					</Button>
				</div>
			</div>
		);
	}

	if (!workspace) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-surface">
				<div className="z-10 text-center">
					<h2 className="text-2xl font-bold text-muted">
						{m.workspace_empty_select_title()}
					</h2>
				</div>
			</div>
		);
	}

	const workspaceCollections = collections
		.filter((c) => c.workspaceId === workspace.id)
		.sort((a, b) => a.order - b.order);

	if (workspaceCollections.length === 0) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-surface">
				<div className="z-10 bg-surface-glass backdrop-blur-xl p-10 rounded-[3rem] shadow-soft border border-surface flex flex-col items-center max-w-md text-center">
					<div className="flex items-center gap-2 mb-3 text-accent">
						<Stars size={16} />
						<span className="text-xs font-bold uppercase tracking-wider text-secondary">
							{m.workspace_getting_started_badge()}
						</span>
					</div>
					<h2 className="text-3xl font-bold text-primary mb-3">
						{m.workspace_empty_collections_title()}
					</h2>
					<p className="text-secondary mb-6 leading-relaxed">
						{m.workspace_empty_collections_body()}
					</p>
					<Button
						type="button"
						onClick={() => setIsCreatingCollection(true)}
						size="lg"
					>
						{m.workspace_empty_collections_button()}
					</Button>
				</div>

				{isCreatingCollection && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay backdrop-blur-sm"
						onClick={() => setIsCreatingCollection(false)}
					>
						<div
							className="bg-surface-elevated p-6 rounded-3xl shadow-2xl w-96 animate-in fade-in zoom-in-95"
							onClick={(e) => e.stopPropagation()}
						>
							<h3 className="text-heading text-primary mb-4">
								{m.workspace_new_collection_modal_title()}
							</h3>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									if (!newColName.trim()) return;
									addCollection({
										workspaceId: workspace.id,
										name: newColName,
									});
									setNewColName("");
									setIsCreatingCollection(false);
								}}
							>
								<div className="mb-4">
									<TextField
										autoFocus
										type="text"
										placeholder={m.workspace_new_collection_modal_placeholder()}
										value={newColName}
										onChange={(e) => setNewColName(e.target.value)}
										containerClassName="w-full"
									/>
								</div>
								<Button type="submit" fullWidth>
									{m.workspace_create_collection_cta()}
								</Button>
							</form>
						</div>
					</div>
				)}
			</div>
		);
	}

	const handleCreateCollection = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newColName.trim()) return;

		addCollection({ workspaceId: workspace.id, name: newColName });
		setNewColName("");
		setIsCreatingCollection(false);
	};

	const handleOpenAddTab = (collectionId: string) => {
		setAddTabModal({ isOpen: true, collectionId });
	};

	const handleConfirmAddTab = (url: string, title: string) => {
		if (!addTabModal.collectionId) return;
		addTab({ collectionId: addTabModal.collectionId, url, title });
	};

	const activeCollectionName = workspaceCollections.find(
		(c) => c.id === addTabModal.collectionId,
	)?.name;

	return (
		<div className="flex-1 overflow-y-auto bg-surface p-8 transition-colors duration-300">
			<div className="flex flex-col gap-8 items-stretch max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-360 mx-auto pb-24">
				{workspaceCollections.map((col) => (
					<CollectionColumn
						key={col.id}
						collection={col}
						tabs={tabs.filter((t) => t.collectionId === col.id)}
						onAddTab={handleOpenAddTab}
						onDeleteTab={(id) => deleteTab(id)}
						onUpdateCollectionName={(id, name) =>
							updateCollectionName({ id, name })
						}
						onDeleteCollection={(id) => deleteCollection(id)}
						highlightedTabId={highlightedTabId}
					/>
				))}

				<div className="w-full transition-all duration-300">
					{!isCreatingCollection ? (
						<button
							onClick={() => setIsCreatingCollection(true)}
							className="w-full py-6 flex flex-col items-center justify-center gap-2 text-accent bg-surface rounded-3xl border-2 border-dashed border-surface-border hover:border-accent hover:bg-surface-elevated/60 transition-all group"
						>
							<div className="w-9 h-9 rounded-full bg-accent-soft text-accent flex items-center justify-center transition-all group-hover:bg-accent group-hover:text-on-accent group-hover:shadow-soft group-hover:scale-105">
								<Plus size={18} strokeWidth={3} />
							</div>
							<span className="font-semibold text-body text-secondary group-hover:text-accent">
								{m.workspace_create_collection_cta()}
							</span>
						</button>
					) : (
						<div className="bg-surface-elevated p-5 rounded-3xl shadow-soft border border-surface animate-in fade-in zoom-in-95 duration-200">
							<div className="flex items-center gap-2 mb-4 text-accent">
								<Stars size={16} />
								<span className="text-xs font-bold uppercase tracking-wider text-secondary">
									{m.workspace_new_group_badge()}
								</span>
							</div>
							<form onSubmit={handleCreateCollection} className="space-y-4">
								<div className="group bottom-shadow-wrapper bottom-shadow-lg bottom-shadow-focus rounded-2xl">
									<input
										autoFocus
										type="text"
										placeholder={m.workspace_new_group_placeholder()}
										className="relative z-10 w-full px-4 py-2.5 bg-surface-elevated border-2 border-surface-border rounded-2xl text-body text-primary placeholder:text-muted focus:outline-none"
										value={newColName}
										onChange={(e) => setNewColName(e.target.value)}
									/>
								</div>
								<div className="flex items-center justify-between gap-4">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setIsCreatingCollection(false)}
										className="px-0 text-secondary hover:text-primary"
									>
										{m.common_cancel()}
									</Button>
									<Button type="submit" size="sm" className="px-6">
										{m.common_create()}
									</Button>
								</div>
							</form>
						</div>
					)}
				</div>
			</div>

			<AddTabModal
				isOpen={addTabModal.isOpen}
				collectionName={activeCollectionName}
				onClose={() => setAddTabModal({ ...addTabModal, isOpen: false })}
				onConfirm={handleConfirmAddTab}
			/>
		</div>
	);
};
