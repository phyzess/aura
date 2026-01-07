import { describe, it, expect } from "vitest";
import {
	groupBy,
	partition,
	chunk,
	flatMapArray,
	unique,
	take,
} from "../../src/fp/array";

describe("Array utilities", () => {
	describe("groupBy", () => {
		it("should group items by key", () => {
			const items = [
				{ type: "a", value: 1 },
				{ type: "b", value: 2 },
				{ type: "a", value: 3 },
			];
			const grouped = groupBy(items, (item) => item.type);
			expect(grouped).toEqual({
				a: [
					{ type: "a", value: 1 },
					{ type: "a", value: 3 },
				],
				b: [{ type: "b", value: 2 }],
			});
		});

		it("should handle empty array", () => {
			const grouped = groupBy([], (item: any) => item.type);
			expect(grouped).toEqual({});
		});
	});

	describe("partition", () => {
		it("should split array by predicate", () => {
			const numbers = [1, 2, 3, 4, 5, 6];
			const [evens, odds] = partition(numbers, (n) => n % 2 === 0);
			expect(evens).toEqual([2, 4, 6]);
			expect(odds).toEqual([1, 3, 5]);
		});

		it("should handle empty array", () => {
			const [pass, fail] = partition([], () => true);
			expect(pass).toEqual([]);
			expect(fail).toEqual([]);
		});

		it("should handle all pass", () => {
			const [pass, fail] = partition([1, 2, 3], () => true);
			expect(pass).toEqual([1, 2, 3]);
			expect(fail).toEqual([]);
		});

		it("should handle all fail", () => {
			const [pass, fail] = partition([1, 2, 3], () => false);
			expect(pass).toEqual([]);
			expect(fail).toEqual([1, 2, 3]);
		});
	});

	describe("chunk", () => {
		it("should split array into chunks", () => {
			const items = [1, 2, 3, 4, 5];
			const chunks = chunk(items, 2);
			expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
		});

		it("should handle exact division", () => {
			const items = [1, 2, 3, 4];
			const chunks = chunk(items, 2);
			expect(chunks).toEqual([
				[1, 2],
				[3, 4],
			]);
		});

		it("should handle empty array", () => {
			const chunks = chunk([], 2);
			expect(chunks).toEqual([]);
		});

		it("should handle size larger than array", () => {
			const chunks = chunk([1, 2], 5);
			expect(chunks).toEqual([[1, 2]]);
		});
	});

	describe("flatMapArray", () => {
		it("should map and flatten", () => {
			const items = [1, 2, 3];
			const result = flatMapArray(items, (n) => [n, n * 2]);
			expect(result).toEqual([1, 2, 2, 4, 3, 6]);
		});

		it("should handle empty arrays in mapping", () => {
			const items = [1, 2, 3];
			const result = flatMapArray(items, (n) => (n % 2 === 0 ? [n] : []));
			expect(result).toEqual([2]);
		});

		it("should handle empty input", () => {
			const result = flatMapArray([], (n: number) => [n]);
			expect(result).toEqual([]);
		});
	});

	describe("unique", () => {
		it("should remove duplicates", () => {
			const items = [1, 2, 2, 3, 3, 3, 4];
			const result = unique(items);
			expect(result).toEqual([1, 2, 3, 4]);
		});

		it("should handle empty array", () => {
			const result = unique([]);
			expect(result).toEqual([]);
		});

		it("should handle no duplicates", () => {
			const result = unique([1, 2, 3]);
			expect(result).toEqual([1, 2, 3]);
		});
	});

	describe("take", () => {
		it("should take first n items", () => {
			const items = [1, 2, 3, 4, 5];
			const result = take(items, 3);
			expect(result).toEqual([1, 2, 3]);
		});

		it("should handle count larger than array", () => {
			const items = [1, 2];
			const result = take(items, 5);
			expect(result).toEqual([1, 2]);
		});

		it("should handle zero count", () => {
			const result = take([1, 2, 3], 0);
			expect(result).toEqual([]);
		});
	});
});

