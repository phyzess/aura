export const groupBy = <T, K extends string | number>(
	items: T[],
	keyFn: (item: T) => K,
): Record<K, T[]> => {
	const result = {} as Record<K, T[]>;
	for (const item of items) {
		const key = keyFn(item);
		if (!result[key]) {
			result[key] = [];
		}
		result[key].push(item);
	}
	return result;
};

export const partition = <T>(
	items: T[],
	predicate: (item: T) => boolean,
): [T[], T[]] => {
	const truthy: T[] = [];
	const falsy: T[] = [];
	for (const item of items) {
		if (predicate(item)) {
			truthy.push(item);
		} else {
			falsy.push(item);
		}
	}
	return [truthy, falsy];
};

export const unique = <T>(items: T[]): T[] => [...new Set(items)];

export const uniqueBy = <T, K>(items: T[], keyFn: (item: T) => K): T[] => {
	const seen = new Set<K>();
	const result: T[] = [];
	for (const item of items) {
		const key = keyFn(item);
		if (!seen.has(key)) {
			seen.add(key);
			result.push(item);
		}
	}
	return result;
};

export const sortBy = <T>(items: T[], keyFn: (item: T) => number): T[] =>
	[...items].sort((a, b) => keyFn(a) - keyFn(b));

export const chunk = <T>(items: T[], size: number): T[][] => {
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size));
	}
	return chunks;
};

export const isEmpty = <T>(items: T[]): boolean => items.length === 0;

export const isNotEmpty = <T>(items: T[]): boolean => items.length > 0;

export const first = <T>(items: T[]): T | undefined => items[0];

export const last = <T>(items: T[]): T | undefined => items[items.length - 1];

export const take = <T>(items: T[], count: number): T[] =>
	items.slice(0, count);

export const drop = <T>(items: T[], count: number): T[] => items.slice(count);

export const compact = <T>(items: (T | null | undefined)[]): T[] =>
	items.filter((item): item is T => item != null);

export const flatten = <T>(items: T[][]): T[] => items.flat();

export const flatMapArray = <T, U>(items: T[], fn: (item: T) => U[]): U[] =>
	items.flatMap(fn);
