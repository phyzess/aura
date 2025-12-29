import { Folder, Pin } from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useMemo } from "react";
import {
	staggerContainerVariants,
	staggerItemVariants,
} from "@/config/animations";
import * as m from "@/paraglide/messages";
import type { Collection, TabItem, Workspace } from "@/types";
import { TabSearchResultItem } from "./TabSearchResultItem";

interface GroupedTabSearchResultsProps {
	tabs: TabItem[];
	workspaces: Workspace[];
	collections: Collection[];
	variant?: "popup" | "dashboard";
	onItemClick: (tab: TabItem, event: React.MouseEvent<HTMLDivElement>) => void;
}

interface TabGroup {
	id: string;
	title: string;
	icon: React.ReactNode;
	tabs: TabItem[];
	collection?: Collection;
	workspace?: Workspace;
}

export const GroupedTabSearchResults: React.FC<
	GroupedTabSearchResultsProps
> = ({ tabs, workspaces, collections, variant = "popup", onItemClick }) => {
	// Group tabs by category
	const groups = useMemo<TabGroup[]>(() => {
		const result: TabGroup[] = [];

		// 1. Pinned tabs group
		const pinnedTabs = tabs.filter((tab) => tab.isPinned);
		if (pinnedTabs.length > 0) {
			result.push({
				id: "pinned",
				title: m.search_group_pinned(),
				icon: <Pin size={12} className="text-accent" />,
				tabs: pinnedTabs,
			});
		}

		// 2. Group by collection
		const collectionGroups = new Map<string, TabItem[]>();
		const tabsWithoutPinned = tabs.filter((tab) => !tab.isPinned);

		for (const tab of tabsWithoutPinned) {
			const existing = collectionGroups.get(tab.collectionId) || [];
			collectionGroups.set(tab.collectionId, [...existing, tab]);
		}

		// Sort collections by tab count (descending)
		const sortedCollections = Array.from(collectionGroups.entries())
			.map(([collectionId, collectionTabs]) => ({
				collectionId,
				tabs: collectionTabs,
				count: collectionTabs.length,
			}))
			.sort((a, b) => b.count - a.count);

		for (const { collectionId, tabs: collectionTabs } of sortedCollections) {
			const collection = collections.find((c) => c.id === collectionId);
			const workspace = collection
				? workspaces.find((w) => w.id === collection.workspaceId)
				: undefined;

			result.push({
				id: collectionId,
				title: collection?.name || m.search_group_unknown_collection(),
				icon: <Folder size={12} className="text-muted" />,
				tabs: collectionTabs,
				collection,
				workspace,
			});
		}

		return result;
	}, [tabs, collections, workspaces]);

	// Find the dominant group (most results, excluding pinned)
	const dominantGroup = useMemo(() => {
		const nonPinnedGroups = groups.filter((g) => g.id !== "pinned");
		if (nonPinnedGroups.length === 0) return null;

		const sorted = [...nonPinnedGroups].sort(
			(a, b) => b.tabs.length - a.tabs.length,
		);
		const top = sorted[0];

		// Only show hint if this group has significantly more results (>40% of total)
		const totalNonPinned = tabs.filter((t) => !t.isPinned).length;
		if (top && top.tabs.length / totalNonPinned > 0.4 && top.tabs.length >= 3) {
			return top;
		}

		return null;
	}, [groups, tabs]);

	const renderItem = (tab: TabItem, group: TabGroup) => {
		const parentCol = group.collection || null;
		const parentWs = group.workspace || null;

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
	};

	return (
		<motion.div
			variants={staggerContainerVariants}
			initial="hidden"
			animate="visible"
			className="space-y-4"
		>
			{/* Smart filter hint */}
			{dominantGroup && groups.length > 2 && (
				<motion.div
					variants={staggerItemVariants}
					className="bg-accent/10 border border-accent/20 rounded-xl p-3 flex items-start gap-2.5"
				>
					<div className="text-accent mt-0.5">💡</div>
					<div className="flex-1 min-w-0">
						<div className="text-xs font-semibold text-accent mb-1">
							{m.search_hint_most_results_title({ title: dominantGroup.title })}
						</div>
						<div className="text-[11px] text-accent/80">
							{m.search_hint_most_results_body({
								count: dominantGroup.tabs.length,
								total: tabs.length,
							})}
						</div>
					</div>
				</motion.div>
			)}

			{/* Grouped results */}
			{groups.map((group) => (
				<motion.div key={group.id} variants={staggerItemVariants}>
					{/* Group header */}
					<div className="flex items-center gap-2 mb-2 px-1">
						{group.icon}
						<span className="text-xs font-bold text-secondary uppercase tracking-wide">
							{group.title}
						</span>
						<span className="text-[10px] font-semibold text-muted bg-surface-muted px-1.5 py-0.5 rounded-full">
							{group.tabs.length}
						</span>
					</div>

					{/* Group items */}
					<div className="space-y-1">
						{group.tabs.map((tab) => renderItem(tab, group))}
					</div>
				</motion.div>
			))}
		</motion.div>
	);
};
