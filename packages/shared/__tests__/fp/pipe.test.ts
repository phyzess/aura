import { describe, expect, it } from "vitest";
import { compose, flow, pipe } from "../../src/fp/pipe";

describe("Pipe", () => {
	describe("pipe", () => {
		it("should create pipeable object with value", () => {
			const result = pipe(5);
			expect(result.value).toBe(5);
		});

		it("should map values", () => {
			const result = pipe(5).map((x) => x + 1);
			expect(result.value).toBe(6);
		});

		it("should chain multiple maps", () => {
			const result = pipe(5)
				.map((x) => x + 1)
				.map((x) => x * 2);
			expect(result.value).toBe(12); // (5 + 1) * 2
		});

		it("should flatMap values", () => {
			const result = pipe(5).flatMap((x) => ({ value: x * 2 }));
			expect(result.value).toBe(10);
		});

		it("should filter values", () => {
			const result = pipe(5).filter((x) => x > 3);
			expect(result.value).toBe(5);
		});

		it("should tap without changing value", () => {
			let sideEffect = 0;
			const result = pipe(5).tap((x) => {
				sideEffect = x * 2;
			});
			expect(result.value).toBe(5);
			expect(sideEffect).toBe(10);
		});
	});

	describe("compose", () => {
		it("should apply functions right to left", () => {
			const add1 = (x: number) => x + 1;
			const mul2 = (x: number) => x * 2;
			const fn = compose(mul2, add1);
			expect(fn(5)).toBe(12); // (5 + 1) * 2
		});

		it("should work with single function", () => {
			const add1 = (x: number) => x + 1;
			const fn = compose(add1);
			expect(fn(5)).toBe(6);
		});

		it("should work with multiple functions", () => {
			const add1 = (x: number) => x + 1;
			const mul2 = (x: number) => x * 2;
			const sub3 = (x: number) => x - 3;
			const fn = compose(sub3, mul2, add1);
			expect(fn(5)).toBe(9); // ((5 + 1) * 2) - 3
		});
	});

	describe("flow", () => {
		it("should apply functions left to right", () => {
			const add1 = (x: number) => x + 1;
			const mul2 = (x: number) => x * 2;
			const fn = flow(add1, mul2);
			expect(fn(5)).toBe(12); // (5 + 1) * 2
		});

		it("should work with single function", () => {
			const add1 = (x: number) => x + 1;
			const fn = flow(add1);
			expect(fn(5)).toBe(6);
		});

		it("should work with multiple functions", () => {
			const add1 = (x: number) => x + 1;
			const mul2 = (x: number) => x * 2;
			const sub3 = (x: number) => x - 3;
			const fn = flow(add1, mul2, sub3);
			expect(fn(5)).toBe(9); // ((5 + 1) * 2) - 3
		});

		it("should be equivalent to compose but left to right", () => {
			const add1 = (x: number) => x + 1;
			const mul2 = (x: number) => x * 2;
			const flowResult = flow(add1, mul2)(5);
			const composeResult = compose(mul2, add1)(5);
			expect(flowResult).toBe(composeResult);
			expect(flowResult).toBe(12);
		});
	});
});
