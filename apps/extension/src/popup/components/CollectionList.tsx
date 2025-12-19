import { Folder } from "lucide-react";
import type React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Collection, TabItem } from "../../types";
import { PopupListItem } from "./PopupListItem";

interface CollectionListProps {
	collections: Collection[];
	tabs: TabItem[];
	onCollectionClick: (id: string) => void;
}

export const CollectionList: React.FC<CollectionListProps> = ({
	collections,
	tabs,
	onCollectionClick,
}) => {
	if (collections.length === 0) {
		return <EmptyState title="Empty workspace" />;
	}
	return (
		<div className="grid gap-2 animate-in slide-in-from-right-4 duration-300">
			{collections.map((col) => {
				const tabCount = tabs.filter((t) => t.collectionId === col.id).length;
				return (
					<PopupListItem
						key={col.id}
						icon={<Folder size={18} strokeWidth={2.5} />}
						title={col.name}
						subtitle={`${tabCount} items`}
						onClick={() => onCollectionClick(col.id)}
					/>
				);
			})}
		</div>
	);
};
