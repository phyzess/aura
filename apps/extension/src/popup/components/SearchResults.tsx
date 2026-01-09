import { Search } from "lucide-react";
import type React from "react";
import { TabSearchResultList } from "@/features/tab/components";
import * as m from "@/paraglide/messages";
import { ChromeService } from "../../services/chrome";
import type { Collection, TabItem, Workspace } from "../../types";

interface SearchResultsProps {
	query: string;
	results: TabItem[];
	workspaces: Workspace[];
	collections: Collection[];
}

export const SearchResults: React.FC<SearchResultsProps> = ({
	query,
	results,
	workspaces,
	collections,
}) => {
	if (!query) return null;
	if (results.length === 0) {
		return (
			<div className="space-y-1 animate-in slide-in-from-bottom-2 duration-300">
				<div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
					<div className="w-12 h-12 bg-surface-muted rounded-full flex items-center justify-center mb-3 text-muted">
						<Search size={20} />
					</div>
					<p className="text-body font-semibold text-secondary">
						{m.global_search_no_results_title()}
					</p>
					<p className="text-xs text-muted mt-1">
						{m.global_search_no_results_subtitle()}
					</p>
				</div>
			</div>
		);
	}
	return (
		<TabSearchResultList
			tabs={results}
			workspaces={workspaces}
			collections={collections}
			variant="popup"
			onItemClick={(tab) => {
				ChromeService.openTab(tab.url);
			}}
		/>
	);
};
