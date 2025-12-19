import type React from "react";
import type { Collection, TabItem, Workspace } from "@/types";
import { TabSearchResultItem } from "./TabSearchResultItem";

type TabSearchResultVariant = "popup" | "dashboard";

interface TabSearchResultListProps {
	tabs: TabItem[];
	workspaces: Workspace[];
	collections: Collection[];
	variant?: TabSearchResultVariant;
	onItemClick: (tab: TabItem, event: React.MouseEvent<HTMLDivElement>) => void;
}

export const TabSearchResultList: React.FC<TabSearchResultListProps> = ({
	tabs,
	workspaces,
	collections,
	variant = "popup",
	onItemClick,
}) => {
	return (
		<div className="space-y-1 animate-in slide-in-from-bottom-2 duration-300">
			{tabs.map((tab) => {
				const parentCol =
					collections.find((c) => c.id === tab.collectionId) || null;
				const parentWs = parentCol
					? workspaces.find((w) => w.id === parentCol.workspaceId) || null
					: null;
				return (
					<TabSearchResultItem
						key={tab.id}
						tab={tab}
						workspace={parentWs}
						collection={parentCol}
						variant={variant}
						onClick={onItemClick}
					/>
				);
			})}
		</div>
	);
};
