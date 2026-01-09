import { useEffect, useMemo, useState } from "react";
import * as m from "@/paraglide/messages";
import type { Collection, TabItem } from "@/types";

export interface TabSearchGroup {
	type: "current" | "other";
	label: string;
	tabs: TabItem[];
}

interface UseTabSearchOptions {
	tabs: TabItem[];
	collections?: Collection[];
	activeWorkspaceId?: string | null;
	debounceMs?: number;
}

export function useTabSearch({
	tabs,
	collections = [],
	activeWorkspaceId = null,
	debounceMs = 300,
}: UseTabSearchOptions) {
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");

	useEffect(() => {
		const trimmed = query.trim();
		if (!trimmed) {
			setDebouncedQuery("");
			return;
		}

		const timer = window.setTimeout(() => {
			setDebouncedQuery(trimmed);
		}, debounceMs);

		return () => window.clearTimeout(timer);
	}, [query, debounceMs]);

	const results = useMemo(() => {
		if (!debouncedQuery) return [] as TabItem[];
		const lower = debouncedQuery.toLowerCase();

		// Build collection -> workspace map
		const collectionWorkspaceMap = new Map<string, string>();
		for (const collection of collections) {
			collectionWorkspaceMap.set(collection.id, collection.workspaceId);
		}

		const scored = tabs
			.map((tab) => {
				const title = (tab.title ?? "").toLowerCase();
				const url = (tab.url ?? "").toLowerCase();
				const titleIndex = title.indexOf(lower);
				const urlIndex = url.indexOf(lower);
				if (titleIndex === -1 && urlIndex === -1) return null;

				// Determine if tab belongs to active workspace
				const tabWorkspaceId = tab.collectionId
					? collectionWorkspaceMap.get(tab.collectionId)
					: null;
				const isCurrentWorkspace =
					activeWorkspaceId && tabWorkspaceId === activeWorkspaceId;

				return { tab, titleIndex, urlIndex, isCurrentWorkspace };
			})
			.filter(
				(
					entry,
				): entry is {
					tab: TabItem;
					titleIndex: number;
					urlIndex: number;
					isCurrentWorkspace: boolean;
				} => entry !== null,
			);

		scored.sort((a, b) => {
			// 1. Pinned tabs first
			const aPinned = !!a.tab.isPinned;
			const bPinned = !!b.tab.isPinned;
			if (aPinned !== bPinned) return aPinned ? -1 : 1;

			// 2. Current workspace first (if activeWorkspaceId is set)
			if (activeWorkspaceId) {
				if (a.isCurrentWorkspace !== b.isCurrentWorkspace) {
					return a.isCurrentWorkspace ? -1 : 1;
				}
			}

			// 3. Title match over URL match
			const aTitleHit = a.titleIndex !== -1;
			const bTitleHit = b.titleIndex !== -1;
			if (aTitleHit !== bTitleHit) return aTitleHit ? -1 : 1;

			// 4. Earlier match position
			const aPos = a.titleIndex !== -1 ? a.titleIndex : a.urlIndex;
			const bPos = b.titleIndex !== -1 ? b.titleIndex : b.urlIndex;
			if (aPos !== bPos) return aPos - bPos;

			// 5. Most recent first
			const aTime = a.tab.updatedAt ?? a.tab.createdAt ?? 0;
			const bTime = b.tab.updatedAt ?? b.tab.createdAt ?? 0;
			if (aTime !== bTime) return bTime - aTime;

			return 0;
		});

		return scored.map((entry) => entry.tab);
	}, [tabs, collections, activeWorkspaceId, debouncedQuery]);

	// Group results by workspace
	const groupedResults = useMemo(() => {
		if (!activeWorkspaceId || results.length === 0) {
			return null;
		}

		// Build collection -> workspace map
		const collectionWorkspaceMap = new Map<string, string>();
		for (const collection of collections) {
			collectionWorkspaceMap.set(collection.id, collection.workspaceId);
		}

		const currentWorkspaceTabs: TabItem[] = [];
		const otherWorkspaceTabs: TabItem[] = [];

		for (const tab of results) {
			const tabWorkspaceId = tab.collectionId
				? collectionWorkspaceMap.get(tab.collectionId)
				: null;
			if (tabWorkspaceId === activeWorkspaceId) {
				currentWorkspaceTabs.push(tab);
			} else {
				otherWorkspaceTabs.push(tab);
			}
		}

		const groups: TabSearchGroup[] = [];
		if (currentWorkspaceTabs.length > 0) {
			groups.push({
				type: "current",
				label: m.search_group_current_workspace(),
				tabs: currentWorkspaceTabs,
			});
		}
		if (otherWorkspaceTabs.length > 0) {
			groups.push({
				type: "other",
				label: m.search_group_other_workspaces(),
				tabs: otherWorkspaceTabs,
			});
		}

		return groups.length > 0 ? groups : null;
	}, [results, collections, activeWorkspaceId]);

	const clear = () => {
		setQuery("");
		setDebouncedQuery("");
	};

	const isSearching = !!query.trim();

	return {
		query,
		setQuery,
		debouncedQuery,
		results,
		groupedResults,
		clear,
		isSearching,
	};
}
