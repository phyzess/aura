import { describe, expect, it } from "vitest";
import {
	err,
	flatMap,
	isErr,
	isOk,
	map,
	ok,
	tryCatch,
} from "../../src/fp/result";

describe("Result", () => {
	describe("ok", () => {
		it("should create success result", () => {
			const result = ok(42);
			expect(result.ok).toBe(true);
			expect(result.value).toBe(42);
		});

		it("should create success result with null", () => {
			const result = ok(null);
			expect(result.ok).toBe(true);
			expect(result.value).toBe(null);
		});
	});

	describe("err", () => {
		it("should create error result", () => {
			const result = err("error message");
			expect(result.ok).toBe(false);
			expect(result.error).toBe("error message");
		});

		it("should create error result with Error object", () => {
			const error = new Error("boom");
			const result = err(error);
			expect(result.ok).toBe(false);
			expect(result.error).toBe(error);
		});
	});

	describe("isOk", () => {
		it("should return true for ok result", () => {
			const result = ok(42);
			expect(isOk(result)).toBe(true);
		});

		it("should return false for err result", () => {
			const result = err("error");
			expect(isOk(result)).toBe(false);
		});
	});

	describe("isErr", () => {
		it("should return true for err result", () => {
			const result = err("error");
			expect(isErr(result)).toBe(true);
		});

		it("should return false for ok result", () => {
			const result = ok(42);
			expect(isErr(result)).toBe(false);
		});
	});

	describe("map", () => {
		it("should transform ok value", () => {
			const result = ok(2);
			const mapped = map((x: number) => x * 2)(result);
			expect(mapped.ok).toBe(true);
			expect(mapped.value).toBe(4);
		});

		it("should skip err value", () => {
			const result = err("error");
			const mapped = map((x: number) => x * 2)(result);
			expect(mapped.ok).toBe(false);
			expect(mapped.error).toBe("error");
		});

		it("should chain multiple maps", () => {
			const result = ok(2);
			const mapped = map((x: number) => x + 1)(
				map((x: number) => x * 2)(result),
			);
			expect(mapped.ok).toBe(true);
			expect(mapped.value).toBe(5);
		});
	});

	describe("flatMap", () => {
		it("should flatten nested ok results", () => {
			const result = ok(2);
			const flattened = flatMap((x: number) => ok(x * 2))(result);
			expect(flattened.ok).toBe(true);
			expect(flattened.value).toBe(4);
		});

		it("should propagate inner error", () => {
			const result = ok(2);
			const flattened = flatMap(() => err("inner error"))(result);
			expect(flattened.ok).toBe(false);
			expect(flattened.error).toBe("inner error");
		});

		it("should skip err value", () => {
			const result = err("outer error");
			const flattened = flatMap((x: number) => ok(x * 2))(result);
			expect(flattened.ok).toBe(false);
			expect(flattened.error).toBe("outer error");
		});
	});

	describe("tryCatch", () => {
		it("should catch errors and return err result", () => {
			const result = tryCatch(() => {
				throw new Error("boom");
			});
			expect(result.ok).toBe(false);
			expect(result.error).toBeInstanceOf(Error);
			expect(result.error.message).toBe("boom");
		});

		it("should return ok result for successful execution", () => {
			const result = tryCatch(() => 42);
			expect(result.ok).toBe(true);
			expect(result.value).toBe(42);
		});

		it("should catch non-Error throws", () => {
			const result = tryCatch(() => {
				throw "string error";
			});
			expect(result.ok).toBe(false);
			expect(result.error).toBe("string error");
		});
	});
});
