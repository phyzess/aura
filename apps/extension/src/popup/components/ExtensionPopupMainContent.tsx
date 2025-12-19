import type React from "react";
import type { Collection, TabItem, Workspace } from "../../types";
import { CollectionList } from "./CollectionList";
import { SearchResults } from "./SearchResults";
import { TabList } from "./TabList";
import { WorkspaceList } from "./WorkspaceList";

type ViewLevel = "workspaces" | "collections" | "tabs";

interface ExtensionPopupMainContentProps {
	viewLevel: ViewLevel;
	searchQuery: string;
	searchResults: TabItem[];
	nonEmptyWorkspaces: Workspace[];
	currentCollections: Collection[];
	currentTabs: TabItem[];
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
	onWorkspaceClick: (id: string) => void;
	onCollectionClick: (id: string) => void;
}

export const ExtensionPopupMainContent: React.FC<
	ExtensionPopupMainContentProps
> = ({
	viewLevel,
	searchQuery,
	searchResults,
	nonEmptyWorkspaces,
	currentCollections,
	currentTabs,
	workspaces,
	collections,
	tabs,
	onWorkspaceClick,
	onCollectionClick,
}) => {
	return (
		<div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
			{searchQuery ? (
				<SearchResults
					query={searchQuery}
					results={searchResults}
					workspaces={workspaces}
					collections={collections}
				/>
			) : (
				<>
					{viewLevel === "workspaces" && (
						<WorkspaceList
							workspaces={nonEmptyWorkspaces}
							collections={collections}
							onWorkspaceClick={onWorkspaceClick}
						/>
					)}
					{viewLevel === "collections" && (
						<CollectionList
							collections={currentCollections}
							tabs={tabs}
							onCollectionClick={onCollectionClick}
						/>
					)}
					{viewLevel === "tabs" && <TabList tabs={currentTabs} />}
				</>
			)}
		</div>
	);
};
