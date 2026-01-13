export interface TobyCard {
	url?: string;
	title?: string;
}

export interface TobyList {
	title?: string;
	cards?: TobyCard[];
}

export interface TobyData {
	lists?: TobyList[];
}

export interface ImportTobyPayload {
	data: TobyData;
	targetWorkspaceId: string | "new";
	newWorkspaceName?: string;
	targetCollectionId: string | "new";
	newCollectionName?: string;
}

export interface ImportedTab {
	url: string;
	title: string;
}

export interface ImportedCollection {
	name: string;
	tabs: ImportedTab[];
}

export const validateTobyData = (data: any): data is TobyData => {
	return data && Array.isArray(data.lists);
};

export const extractValidCard = (card: TobyCard): ImportedTab | null => {
	if (!card.url || !card.title) return null;
	return {
		url: card.url,
		title: card.title,
	};
};

export const extractValidCards = (cards: TobyCard[]): ImportedTab[] => {
	return cards
		.map(extractValidCard)
		.filter((card): card is ImportedTab => card !== null);
};

export const parseTobyList = (list: TobyList): ImportedCollection | null => {
	if (!list.title || !list.cards || !Array.isArray(list.cards)) {
		return null;
	}

	const tabs = extractValidCards(list.cards);
	if (tabs.length === 0) return null;

	return {
		name: list.title,
		tabs,
	};
};

export const parseTobyData = (data: TobyData): ImportedCollection[] => {
	if (!data.lists || !Array.isArray(data.lists)) {
		return [];
	}

	return data.lists
		.map(parseTobyList)
		.filter(
			(collection): collection is ImportedCollection => collection !== null,
		);
};

export const flattenTobyDataToTabs = (data: TobyData): ImportedTab[] => {
	const collections = parseTobyData(data);
	return collections.flatMap((collection) => collection.tabs);
};

export const shouldCreateSingleCollection = (
	targetCollectionId: string | "new",
	newCollectionName?: string,
): boolean => {
	return (
		targetCollectionId !== "new" ||
		(targetCollectionId === "new" && !!newCollectionName)
	);
};

export const shouldCreateMultipleCollections = (
	targetCollectionId: string | "new",
	newCollectionName?: string,
): boolean => {
	return !shouldCreateSingleCollection(targetCollectionId, newCollectionName);
};
