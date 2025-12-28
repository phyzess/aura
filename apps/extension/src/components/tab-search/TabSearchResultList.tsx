import { Layout } from "lucide-react";
import type React from "react";
import type { TabSearchGroup } from "@/hooks/useTabSearch";
import type { Collection, TabItem, Workspace } from "@/types";
import { GroupedTabSearchResults } from "./GroupedTabSearchResults";
import { TabSearchResultItem } from "./TabSearchResultItem";

type TabSearchResultVariant = "popup" | "dashboard";

interface TabSearchResultListProps {
	tabs: TabItem[];
	workspaces: Workspace[];
	collections: Collection[];
	variant?: TabSearchResultVariant;
	groups?: TabSearchGroup[] | null;
	onItemClick: (tab: TabItem, event: React.MouseEvent<HTMLDivElement>) => void;
}

export const TabSearchResultList: React.FC<TabSearchResultListProps> = ({
	tabs,
	workspaces,
	collections,
	variant = "popup",
	groups = null,
	onItemClick,
}) => {
	// If workspace groups are provided, use workspace-based grouping
	if (groups && groups.length > 0) {
		return (
			<div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
				{groups.map((group) => (
					<div key={group.type}>
						{/* Group header */}
						<div className="flex items-center gap-2 mb-2 px-1">
							<Layout size={12} className="text-accent" />
							<span className="text-xs font-bold text-secondary uppercase tracking-wide">
								{group.label}
							</span>
							<span className="text-[10px] font-semibold text-muted bg-surface-muted px-1.5 py-0.5 rounded-full">
								{group.tabs.length}
							</span>
						</div>

						{/* Group items */}
						<div className="space-y-1">
							{group.tabs.map((tab) => {
								const collection = collections.find(
									(c) => c.id === tab.collectionId,
								);
								const workspace = collection
									? workspaces.find((w) => w.id === collection.workspaceId)
									: undefined;

								return (
									<TabSearchResultItem
										key={tab.id}
										tab={tab}
										workspace={workspace || null}
										collection={collection || null}
										variant={variant}
										onClick={onItemClick}
									/>
								);
							})}
						</div>
					</div>
				))}
			</div>
		);
	}

	// Otherwise, use the default collection-based grouping
	return (
		<GroupedTabSearchResults
			tabs={tabs}
			workspaces={workspaces}
			collections={collections}
			variant={variant}
			onItemClick={onItemClick}
		/>
	);
};
