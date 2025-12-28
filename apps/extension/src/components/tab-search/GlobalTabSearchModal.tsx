import { Command, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { useTabSearch } from "@/hooks/useTabSearch";
import * as m from "@/paraglide/messages";
import { ChromeService } from "@/services/chrome";
import type { Collection, TabItem, Workspace } from "@/types";
import { TabSearchResultList } from "./TabSearchResultList";

interface GlobalTabSearchModalProps {
	isOpen: boolean;
	onClose: () => void;
	workspaces: Workspace[];
	collections: Collection[];
	tabs: TabItem[];
	activeWorkspaceId?: string | null;
	onSelectTab: (tabId: string) => void;
}

export const GlobalTabSearchModal: React.FC<GlobalTabSearchModalProps> = ({
	isOpen,
	onClose,
	workspaces,
	collections,
	tabs,
	activeWorkspaceId,
	onSelectTab,
}) => {
	const { query, setQuery, results, groupedResults, clear } = useTabSearch({
		tabs,
		collections,
		activeWorkspaceId,
	});
	const inputRef = useRef<HTMLInputElement>(null);

	const handleClose = useCallback(() => {
		clear();
		onClose();
	}, [clear, onClose]);

	useEffect(() => {
		if (!isOpen) return;
		const id = window.setTimeout(() => {
			inputRef.current?.focus();
		}, 0);
		return () => {
			window.clearTimeout(id);
		};
	}, [isOpen]);

	const showIntro = !query;
	const showNoResults = !!query && results.length === 0;

	return (
		<Dialog
			isOpen={isOpen}
			onClose={handleClose}
			size="xl"
			position="top"
			className="bg-transparent shadow-none border-none p-0"
			overlayClassName="bg-surface-overlay/80"
		>
			<Card
				border={false}
				variant="elevated"
				radius="2xl"
				className="relative w-full max-w-2xl shadow-soft flex flex-col overflow-hidden"
			>
				<CardHeader className="bg-surface-elevated/80 backdrop-blur-sm flex-col items-stretch justify-start gap-0 px-0 py-0">
					<div className="flex items-center justify-between px-4 pt-3 pb-2">
						<div className="flex items-center gap-2">
							<div className="w-6 h-6 rounded-full bg-accent-soft flex items-center justify-center text-accent">
								<Command size={14} />
							</div>
							<div className="flex flex-col">
								<span className="text-xs font-semibold text-primary">
									{m.global_search_title()}
								</span>
								<span className="text-[11px] text-secondary">
									{m.global_search_subtitle()}
								</span>
							</div>
						</div>
						<IconButton
							type="button"
							variant="subtle"
							size="sm"
							aria-label={m.global_search_close_aria()}
							onClick={handleClose}
							className="mr-2 h-7 w-7 text-muted hover:text-secondary hover:bg-surface-muted"
						>
							<X size={14} />
						</IconButton>
					</div>
					<div className="px-4 pb-3 pt-1">
						<SearchInput
							value={query}
							onChange={setQuery}
							inputRef={inputRef}
							placeholder={m.global_search_input_placeholder()}
						/>
					</div>
				</CardHeader>
				<CardBody className="max-h-105 overflow-y-auto bg-surface px-4 pb-4 pt-3">
					{showIntro && (
						<div className="py-10 text-center text-xs text-muted">
							<div className="mb-2 font-semibold text-secondary">
								{m.global_search_intro_title()}
							</div>
							<div className="opacity-80">
								{m.global_search_intro_stats({
									tabCount: tabs.length,
									collectionCount: collections.length,
									workspaceCount: workspaces.length,
								})}
							</div>
						</div>
					)}
					{showNoResults && (
						<div className="py-10 text-center text-xs text-muted">
							<div className="mb-2 font-semibold text-secondary">
								{m.global_search_no_results_title()}
							</div>
							<div className="opacity-80">
								{m.global_search_no_results_subtitle()}
							</div>
						</div>
					)}
					{!showIntro && !showNoResults && (
						<TabSearchResultList
							tabs={results}
							workspaces={workspaces}
							collections={collections}
							variant="dashboard"
							groups={groupedResults}
							onItemClick={(tab, event) => {
								if (event.metaKey || event.ctrlKey) {
									onSelectTab(tab.id);
								} else {
									ChromeService.openTab(tab.url);
								}
								handleClose();
							}}
						/>
					)}
				</CardBody>
			</Card>
		</Dialog>
	);
};
