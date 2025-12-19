import { useEffect, useMemo, useState } from "react";
import type { TabItem } from "@/types";

interface UseTabSearchOptions {
	tabs: TabItem[];
	debounceMs?: number;
}

export function useTabSearch({ tabs, debounceMs = 300 }: UseTabSearchOptions) {
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

		const scored = tabs
			.map((tab) => {
				const title = (tab.title ?? "").toLowerCase();
				const url = (tab.url ?? "").toLowerCase();
				const titleIndex = title.indexOf(lower);
				const urlIndex = url.indexOf(lower);
				if (titleIndex === -1 && urlIndex === -1) return null;
				return { tab, titleIndex, urlIndex };
			})
			.filter(
				(
					entry,
				): entry is {
					tab: TabItem;
					titleIndex: number;
					urlIndex: number;
				} => entry !== null,
			);

		scored.sort((a, b) => {
			const aPinned = !!a.tab.isPinned;
			const bPinned = !!b.tab.isPinned;
			if (aPinned !== bPinned) return aPinned ? -1 : 1;

			const aTitleHit = a.titleIndex !== -1;
			const bTitleHit = b.titleIndex !== -1;
			if (aTitleHit !== bTitleHit) return aTitleHit ? -1 : 1;

			const aPos = a.titleIndex !== -1 ? a.titleIndex : a.urlIndex;
			const bPos = b.titleIndex !== -1 ? b.titleIndex : b.urlIndex;
			if (aPos !== bPos) return aPos - bPos;

			const aTime = a.tab.updatedAt ?? a.tab.createdAt ?? 0;
			const bTime = b.tab.updatedAt ?? b.tab.createdAt ?? 0;
			if (aTime !== bTime) return bTime - aTime;

			return 0;
		});

		return scored.map((entry) => entry.tab);
	}, [tabs, debouncedQuery]);

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
		clear,
		isSearching,
	};
}
