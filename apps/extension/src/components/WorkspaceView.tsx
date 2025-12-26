import {
	type CollisionDetection,
	closestCenter,
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	type DropAnimation,
	defaultDropAnimationSideEffects,
	getFirstCollision,
	KeyboardSensor,
	MeasuringStrategy,
	PointerSensor,
	pointerWithin,
	rectIntersection,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useAtomValue, useSetAtom } from "jotai";
import { Plus, Stars } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { BottomShadow } from "@/components/ui/BottomShadow";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import * as m from "@/paraglide/messages";
import {
	addCollectionAtom,
	addTabAtom,
	createWorkspaceAtom,
	deleteCollectionAtom,
	deleteTabAtom,
	moveTabAtom,
	reorderWorkspaceCollectionsAtom,
	updateCollectionNameAtom,
} from "@/store/actions";
import { workspacesAtom } from "@/store/atoms";
import { activeWorkspaceAtom } from "@/store/selectors";
import type { Collection, TabItem } from "@/types";
import { AddTabModal } from "./AddTabModal";
import { CollectionColumn } from "./CollectionColumn";
import { TabCard } from "./TabCard";

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
	const moveTab = useSetAtom(moveTabAtom);
	const reorderWorkspaceCollections = useSetAtom(
		reorderWorkspaceCollectionsAtom,
	);

	const [isCreatingCollection, setIsCreatingCollection] = useState(false);
	const [newColName, setNewColName] = useState("");

	const [activeId, setActiveId] = useState<string | null>(null);
	const [overId, setOverId] = useState<string | null>(null);
	const [clonedTabs, setClonedTabs] = useState<TabItem[] | null>(null);
	const lastOverId = useRef<string | null>(null);
	const recentlyMovedToNewContainer = useRef(false);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		}),
		useSensor(KeyboardSensor),
	);

	const [addTabModal, setAddTabModal] = useState<{
		isOpen: boolean;
		collectionId: string | null;
	}>({
		isOpen: false,
		collectionId: null,
	});

	const [highlightedTabId, setHighlightedTabId] = useState<string | null>(null);

	// Reset the recently moved flag after items change
	useEffect(() => {
		requestAnimationFrame(() => {
			recentlyMovedToNewContainer.current = false;
		});
	}, [tabs]);

	// Custom drop animation configuration
	const dropAnimation: DropAnimation = {
		sideEffects: defaultDropAnimationSideEffects({
			styles: {
				active: {
					opacity: "0.4",
				},
			},
		}),
		duration: 200,
		easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
	};

	// Helper function to find which collection a tab or collection belongs to
	const findContainer = useCallback(
		(id: string) => {
			// Check if it's a collection itself
			const isCollection = collections.some((c) => c.id === id);
			if (isCollection) {
				return id;
			}
			// Find the collection that contains this tab
			const tab = tabs.find((t) => t.id === id);
			return tab?.collectionId;
		},
		[collections, tabs],
	);

	/**
	 * Custom collision detection strategy optimized for multiple containers
	 * Based on dnd-kit's MultipleContainers example
	 */
	const collisionDetectionStrategy: CollisionDetection = useCallback(
		(args) => {
			// When dragging a collection, only detect collisions with other collections
			if (activeId && collections.some((c) => c.id === activeId)) {
				return closestCenter({
					...args,
					droppableContainers: args.droppableContainers.filter((container) =>
						collections.some((c) => c.id === container.id),
					),
				});
			}

			// Start by finding any intersecting droppable with the pointer
			const pointerIntersections = pointerWithin(args);
			const intersections =
				pointerIntersections.length > 0
					? pointerIntersections
					: rectIntersection(args);
			let overId = getFirstCollision(intersections, "id");

			if (overId != null) {
				const overContainer = findContainer(overId as string);

				if (overContainer) {
					const containerTabs = tabs
						.filter((t) => t.collectionId === overContainer)
						.map((t) => t.id);

					// If a container is matched and it contains items
					if (containerTabs.length > 0) {
						// Return the closest droppable within that container
						overId = closestCenter({
							...args,
							droppableContainers: args.droppableContainers.filter(
								(container) =>
									container.id !== overContainer &&
									containerTabs.includes(container.id as string),
							),
						})[0]?.id;
					}
				}

				lastOverId.current = overId as string;
				return [{ id: overId }];
			}

			// When a draggable item moves to a new container, the layout may shift
			if (recentlyMovedToNewContainer.current) {
				lastOverId.current = activeId;
			}

			// If no droppable is matched, return the last match
			return lastOverId.current ? [{ id: lastOverId.current }] : [];
		},
		[activeId, collections, tabs, findContainer],
	);

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

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string);
		setClonedTabs(tabs);
	};

	const handleDragOver = (event: DragOverEvent) => {
		const { active, over } = event;
		const overId = over?.id;

		setOverId(overId as string | null);

		if (!overId || collections.some((c) => c.id === active.id)) {
			return;
		}

		const overContainer = findContainer(overId as string);
		const activeContainer = findContainer(active.id as string);

		if (!overContainer || !activeContainer) {
			return;
		}

		if (activeContainer !== overContainer) {
			// Moving to a different container
			const overItems = tabs
				.filter((t) => t.collectionId === overContainer)
				.sort((a, b) => a.order - b.order);

			const overIndex = overItems.findIndex((t) => t.id === overId);

			let newIndex: number;
			// Check if dropping on a container (not on a specific tab)
			const isOverContainer = collections.some((c) => c.id === overId);

			if (isOverContainer) {
				// Dropping on a container - add to the end
				newIndex = overItems.length;
			} else {
				// Dropping on an item - calculate position
				const isBelowOverItem =
					over &&
					active.rect.current.translated &&
					active.rect.current.translated.top > over.rect.top + over.rect.height;

				const modifier = isBelowOverItem ? 1 : 0;
				newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
			}

			// Mark that we recently moved to a new container for collision detection
			recentlyMovedToNewContainer.current = true;

			// Update the tab position immediately for visual feedback
			const overTab = tabs.find((t) => t.id === overId);
			moveTab({
				tabId: active.id as string,
				targetCollectionId: overContainer,
				targetIndex: newIndex,
				shouldPin: overTab?.isPinned ?? false,
			});
		} else {
			// Moving within the same container
			const items = tabs
				.filter((t) => t.collectionId === activeContainer)
				.sort((a, b) => a.order - b.order);

			const oldIndex = items.findIndex((t) => t.id === active.id);
			const newIndex = items.findIndex((t) => t.id === overId);

			if (oldIndex !== newIndex) {
				const overTab = tabs.find((t) => t.id === overId);
				moveTab({
					tabId: active.id as string,
					targetCollectionId: activeContainer,
					targetIndex: newIndex,
					shouldPin: overTab?.isPinned,
				});
			}
		}
	};

	const handleDragCancel = () => {
		if (clonedTabs) {
			// Reset tabs to their original state
			// Note: We can't directly set tabsAtom here, so we'll just clear the cloned state
			setClonedTabs(null);
		}

		setActiveId(null);
		setOverId(null);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		// Handle collection reordering
		if (
			active.data.current?.type === "COLLECTION" &&
			over?.data.current?.type === "COLLECTION"
		) {
			const oldIndex = workspaceCollections.findIndex(
				(c) => c.id === active.id,
			);
			const newIndex = workspaceCollections.findIndex((c) => c.id === over.id);

			if (oldIndex !== newIndex) {
				const reordered = arrayMove(workspaceCollections, oldIndex, newIndex);
				reorderWorkspaceCollections({
					workspaceId: workspace.id,
					orderedIds: reordered.map((c) => c.id),
				});
			}
		}

		// Clean up state
		// Note: Tab positions have already been updated in handleDragOver
		setActiveId(null);
		setOverId(null);
		setClonedTabs(null);
	};

	const activeCollectionName = workspaceCollections.find(
		(c) => c.id === addTabModal.collectionId,
	)?.name;

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={collisionDetectionStrategy}
			measuring={{
				droppable: {
					strategy: MeasuringStrategy.Always,
				},
			}}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			<div className="flex-1 overflow-y-auto bg-surface p-8 transition-colors duration-300">
				<div className="flex flex-col gap-6 items-stretch max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-360 mx-auto pb-24">
					<SortableContext
						items={workspaceCollections.map((c) => c.id)}
						strategy={verticalListSortingStrategy}
					>
						{workspaceCollections.map((col) => {
							// Only show drop target when dragging a Tab, not a Collection
							const isDraggingCollection = workspaceCollections.some(
								(c) => c.id === activeId,
							);
							const shouldShowDropTarget =
								!isDraggingCollection && overId === col.id;

							return (
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
									isDropTarget={shouldShowDropTarget}
								/>
							);
						})}
					</SortableContext>

					<div className="w-full transition-all duration-300">
						{!isCreatingCollection ? (
							<Button
								onClick={() => setIsCreatingCollection(true)}
								variant="ghost"
								className="w-full px-4 py-3 flex items-center justify-center gap-3 text-accent bg-surface rounded-2xl border border-dashed border-surface-muted hover:border-accent hover:bg-surface-elevated/60 transition-all group"
							>
								<div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-on-accent group-hover:shadow-soft transition-all">
									<Plus size={16} strokeWidth={2.5} />
								</div>
								<span className="font-semibold text-body text-secondary group-hover:text-accent">
									{m.workspace_create_collection_cta()}
								</span>
							</Button>
						) : (
							<div className="bg-surface-elevated p-5 rounded-3xl shadow-soft border border-surface animate-in fade-in zoom-in-95 duration-200">
								<div className="flex items-center gap-2 mb-4 text-accent">
									<Stars size={16} />
									<span className="text-xs font-bold uppercase tracking-wider text-secondary">
										{m.workspace_new_group_badge()}
									</span>
								</div>
								<form onSubmit={handleCreateCollection} className="space-y-4">
									<BottomShadow size="lg" focusWithin className="rounded-2xl">
										<input
											autoFocus
											type="text"
											placeholder={m.workspace_new_group_placeholder()}
											className="relative z-10 w-full px-4 py-2.5 bg-surface-elevated border-2 border-surface-border rounded-2xl text-body text-primary placeholder:text-muted focus:outline-none"
											value={newColName}
											onChange={(e) => setNewColName(e.target.value)}
										/>
									</BottomShadow>
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
			<DragOverlay dropAnimation={dropAnimation}>
				{activeId
					? (() => {
							const activeTab = tabs.find((t) => t.id === activeId);
							if (activeTab) {
								return (
									<div
										style={{
											transform: "rotate(3deg) scale(1.05)",
											cursor: "grabbing",
										}}
									>
										<TabCard
											tab={activeTab}
											onDelete={() => {}}
											isHighlighted={false}
											isDragOverlay={true}
										/>
									</div>
								);
							}

							const activeCollection = workspaceCollections.find(
								(c) => c.id === activeId,
							);
							if (activeCollection) {
								const collectionTabs = tabs.filter(
									(t) => t.collectionId === activeCollection.id,
								);
								return (
									<div
										style={{
											transform: "rotate(2deg) scale(1.05)",
											cursor: "grabbing",
											width: "320px",
										}}
									>
										<Card
											variant="glass"
											interactive
											className="shadow-2xl border-accent/20"
										>
											<CardHeader className="p-4">
												<div className="flex items-center gap-2.5">
													<div className="w-2 h-2 rounded-full bg-accent shadow-glow shrink-0" />
													<h3 className="text-base font-bold text-primary truncate flex-1">
														{activeCollection.name}
													</h3>
													<Badge className="shrink-0 bg-accent/10 text-accent border-accent/20">
														{collectionTabs.length}
													</Badge>
												</div>
											</CardHeader>
										</Card>
									</div>
								);
							}

							return null;
						})()
					: null}
			</DragOverlay>
		</DndContext>
	);
};
