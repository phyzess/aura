import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { HStack } from "@/components/ui/Stack";
import { TextField } from "@/components/ui/TextField";
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
}

export const CollectionColumn: React.FC<CollectionColumnProps> = ({
	collection,
	tabs,
	onAddTab,
	onDeleteTab,
	onUpdateCollectionName,
	onDeleteCollection,
	highlightedTabId,
}) => {
	const sortedTabs = [...tabs].sort((a, b) => a.order - b.order);

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const [isRenaming, setIsRenaming] = useState(false);
	const [renameValue, setRenameValue] = useState(collection.name);
	const inputRef = useRef<HTMLInputElement>(null);

	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		};
		if (isMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isMenuOpen]);

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

	return (
		<Card
			variant="glass"
			interactive
			className="w-full hover:bg-surface-elevated pb-2"
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
							title="Click to rename"
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
						title="Add Tab"
						aria-label="Add tab to collection"
					>
						<Plus size={18} />
					</IconButton>
					<div className="relative" ref={menuRef}>
						<IconButton
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							variant="subtle"
							size="md"
							active={isMenuOpen}
							aria-label="Collection actions"
						>
							<MoreHorizontal size={18} />
						</IconButton>

						{isMenuOpen && (
							<div className="absolute right-0 top-full mt-2 w-48 bg-surface-elevated rounded-xl shadow-xl border border-surface overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-150">
								<div className="p-1.5 flex flex-col gap-0.5">
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
									<div className="h-px bg-surface-muted my-1 mx-1"></div>
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
						)}
					</div>
				</HStack>
			</CardHeader>

			<CardBody className="px-5 pb-4">
				{sortedTabs.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
						{sortedTabs.map((tab) => (
							<TabCard
								key={tab.id}
								tab={tab}
								onDelete={onDeleteTab}
								isHighlighted={highlightedTabId === tab.id}
							/>
						))}
					</div>
				) : (
					<EmptyState
						icon="🍃"
						title={m.workspace_collection_empty_title()}
						description={m.workspace_collection_empty_body()}
						className="my-4 min-h-[120px] max-w-md bg-surface border-solid border-surface-muted"
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
				)}
			</CardBody>

			<ConfirmModal
				isOpen={showDeleteConfirm}
				title="Delete Collection?"
				message={`Are you sure you want to delete "${collection.name}"? All ${sortedTabs.length} tabs in this collection will be lost.`}
				onConfirm={() => onDeleteCollection(collection.id)}
				onClose={() => setShowDeleteConfirm(false)}
			/>
		</Card>
	);
};
