import { Folder } from "lucide-react";
import type React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import * as m from "@/paraglide/messages";
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
		return <EmptyState title={m.popup_collection_list_empty_title()} />;
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
						subtitle={m.popup_collection_list_items_subtitle({
							count: tabCount,
						})}
						onClick={() => onCollectionClick(col.id)}
					/>
				);
			})}
		</div>
	);
};
