import { useDroppable } from "@dnd-kit/core";
import {
	rectSortingStrategy,
	SortableContext,
	useSortable,
} from "@dnd-kit/sortable";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { OpenTabsButton } from "@/components/OpenTabsButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Popover } from "@/components/ui/Popover";
import { HStack } from "@/components/ui/Stack";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import type { Collection, TabItem } from "@/types";
import { ConfirmModal } from "./ConfirmModal";
import { TabCard } from "./TabCard";

interface CollectionColumnProps {
	collection: Collection;
	tabs: TabItem[];
	onAddTab: (collectionId: string) => void;
	onDeleteTab: (id: string) => void;
	onUpdateCollectionName: (id: string, name: string) => void;
	onDeleteCollection: (id: string) => void;
	highlightedTabId?: string | null;
	isDropTarget?: boolean;
}

const COLLECTION_RESTORE_CONFIRM_THRESHOLD = 15;

export const CollectionColumn: React.FC<CollectionColumnProps> = ({
	collection,
	tabs,
	onAddTab,
	onDeleteTab,
	onUpdateCollectionName,
	onDeleteCollection,
	highlightedTabId,
	isDropTarget,
}) => {
	const sortedTabs = [...tabs].sort((a, b) => {
		const aPinned = !!a.isPinned;
		const bPinned = !!b.isPinned;
		if (aPinned !== bPinned) return aPinned ? -1 : 1;

		if (a.order !== b.order) return a.order - b.order;

		const aTime = a.updatedAt ?? a.createdAt ?? 0;
		const bTime = b.updatedAt ?? b.createdAt ?? 0;
		if (aTime !== bTime) return bTime - aTime;

		return 0;
	});

	const pinnedTabs = sortedTabs.filter((t) => !!t.isPinned);
	const regularTabs = sortedTabs.filter((t) => !t.isPinned);

	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const [isRenaming, setIsRenaming] = useState(false);
	const [renameValue, setRenameValue] = useState(collection.name);
	const inputRef = useRef<HTMLInputElement>(null);

	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const {
		attributes,
		listeners,
		setNodeRef: setSortableRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: collection.id,
		data: { type: "COLLECTION", collectionId: collection.id },
	});

	const { setNodeRef: setDroppableRef } = useDroppable({
		id: `droppable-${collection.id}`,
		data: { type: "COLLECTION", collectionId: collection.id },
	});

	const setNodeRef = (node: HTMLElement | null) => {
		setSortableRef(node);
		setDroppableRef(node);
	};

	const style: React.CSSProperties = {
		transform: transform
			? `translate3d(${transform.x}px, ${transform.y}px, 0)`
			: undefined,
		transition,
		zIndex: isDragging ? 30 : undefined,
	};

	useEffect(() => {
		if (isRenaming && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isRenaming]);

	const handleSaveRename = () => {
		if (renameValue.trim() && renameValue !== collection.name) {
			onUpdateCollectionName(collection.id, renameValue.trim());
		} else {
			setRenameValue(collection.name);
		}
		setIsRenaming(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") handleSaveRename();
		if (e.key === "Escape") {
			setRenameValue(collection.name);
			setIsRenaming(false);
		}
	};

	const getCollectionUrls = () => sortedTabs.map((t) => t.url).filter(Boolean);

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<Card
				variant="glass"
				interactive
				selected={isDropTarget}
				className={cn(
					"w-full pb-2 transition-all duration-200",
					isDragging && "opacity-40 scale-95",
					isDropTarget
						? "bg-surface-elevated/90 shadow-soft-hover"
						: "hover:bg-surface-elevated",
				)}
			>
				<CardHeader className="p-5 sticky top-0 z-30">
					<div className="flex items-center gap-2 flex-1 min-w-0">
						<div className="w-2 h-2 rounded-full bg-accent shadow-glow flex-shrink-0"></div>

						{isRenaming ? (
							<TextField
								ref={inputRef}
								type="text"
								value={renameValue}
								onChange={(e) => setRenameValue(e.target.value)}
								onBlur={handleSaveRename}
								onKeyDown={handleKeyDown}
								size="sm"
								containerClassName="w-full max-w-[200px]"
								inputClassName="px-2 py-1 font-bold text-primary text-lg tracking-tight"
							/>
						) : (
							<h3
								className="font-bold text-primary text-lg tracking-tight truncate cursor-pointer hover:text-accent transition-colors"
								onClick={() => {
									setIsRenaming(true);
									setIsMenuOpen(false);
								}}
								title={m.collection_rename_title()}
							>
								{collection.name}
							</h3>
						)}

						{!isRenaming && (
							<Badge className="flex-shrink-0">{sortedTabs.length}</Badge>
						)}
					</div>

					<HStack gap="xs" className="relative">
						<IconButton
							onClick={() => onAddTab(collection.id)}
							variant="neutral"
							size="md"
							title={m.collection_add_tab_title()}
							aria-label="Add tab to collection"
						>
							<Plus size={18} />
						</IconButton>
						<Popover
							isOpen={isMenuOpen}
							onClickOutside={() => setIsMenuOpen(false)}
							positions={["bottom"]}
							align="end"
							content={
								<div className="w-52">
									<div className="p-1.5 flex flex-col gap-0.5">
										{sortedTabs.length > 0 && (
											<>
												<OpenTabsButton
													mode="new-window"
													getUrls={getCollectionUrls}
													confirmThreshold={
														COLLECTION_RESTORE_CONFIRM_THRESHOLD
													}
													showIcon
													variant="menu"
													onClick={() => setIsMenuOpen(false)}
												/>
												<OpenTabsButton
													mode="current"
													getUrls={getCollectionUrls}
													confirmThreshold={
														COLLECTION_RESTORE_CONFIRM_THRESHOLD
													}
													showIcon
													variant="menu"
													onClick={() => setIsMenuOpen(false)}
												/>
												<div className="h-px bg-surface-muted my-1 mx-1" />
											</>
										)}
										<Button
											onClick={() => {
												setIsRenaming(true);
												setIsMenuOpen(false);
											}}
											variant="ghost"
											size="sm"
											className="w-full flex items-center gap-2 px-3 py-2 text-body font-semibold text-secondary hover:bg-surface-muted hover:text-accent rounded-lg transition-colors text-left justify-start"
										>
											<Pencil size={14} /> Rename
										</Button>
										<div className="h-px bg-surface-muted my-1 mx-1" />
										<Button
											onClick={() => {
												setShowDeleteConfirm(true);
												setIsMenuOpen(false);
											}}
											variant="ghost"
											size="sm"
											className="w-full flex items-center gap-2 px-3 py-2 text-body font-semibold text-danger hover:bg-danger-soft rounded-lg transition-colors text-left justify-start"
										>
											<Trash2 size={14} /> Delete Collection
										</Button>
									</div>
								</div>
							}
						>
							<IconButton
								onClick={() => setIsMenuOpen(!isMenuOpen)}
								variant="subtle"
								size="md"
								active={isMenuOpen}
								aria-label="Collection actions"
							>
								<MoreHorizontal size={18} />
							</IconButton>
						</Popover>
					</HStack>
				</CardHeader>

				<CardBody
					className={cn(
						"px-5 pb-4 transition-all duration-200",
						isDropTarget && "bg-accent-soft/10 ring-2 ring-accent-soft",
					)}
				>
					{sortedTabs.length > 0 ? (
						<SortableContext
							items={sortedTabs.map((t) => t.id)}
							strategy={rectSortingStrategy}
						>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
								{pinnedTabs.map((tab) => (
									<TabCard
										key={tab.id}
										tab={tab}
										onDelete={onDeleteTab}
										isHighlighted={highlightedTabId === tab.id}
									/>
								))}
								{pinnedTabs.length > 0 && regularTabs.length > 0 && (
									<div className="col-span-full h-px bg-surface-muted/80 my-1.5" />
								)}
								{regularTabs.map((tab) => (
									<TabCard
										key={tab.id}
										tab={tab}
										onDelete={onDeleteTab}
										isHighlighted={highlightedTabId === tab.id}
									/>
								))}
							</div>
						</SortableContext>
					) : (
						<div
							className={cn(
								"my-4 min-h-[120px] rounded-2xl transition-all duration-200",
								isDropTarget &&
									"bg-accent-soft/20 border-2 border-dashed border-accent",
							)}
						>
							<EmptyState
								icon="🍃"
								title={m.workspace_collection_empty_title()}
								description={m.workspace_collection_empty_body()}
								className="bg-transparent border-none"
								action={
									<Button
										onClick={() => onAddTab(collection.id)}
										variant="secondary"
										size="sm"
										className="flex items-center gap-2"
									>
										<Plus size={12} strokeWidth={3} />
										{m.workspace_collection_empty_button()}
									</Button>
								}
							/>
						</div>
					)}
				</CardBody>

				<ConfirmModal
					isOpen={showDeleteConfirm}
					title={m.collection_delete_confirm_title()}
					message={m.collection_delete_confirm_message({
						name: collection.name,
						count: sortedTabs.length,
					})}
					onConfirm={() => onDeleteCollection(collection.id)}
					onClose={() => setShowDeleteConfirm(false)}
				/>
			</Card>
		</div>
	);
};
