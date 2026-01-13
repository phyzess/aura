import type { Result } from "@aura/shared";
import { expect } from "vitest";

/**
 * Unwrap a Result and throw if it's an error
 */
export function unwrapResult<T>(result: Result<T, Error>): T {
	if (!result.ok) {
		throw result.error;
	}
	return result.value;
}

/**
 * Expect a Result to be Ok and return the value
 */
export function expectOk<T>(result: Result<T, Error>): T {
	expect(result.ok).toBe(true);
	if (!result.ok) {
		throw new Error(`Expected Ok but got Err: ${result.error.message}`);
	}
	return result.value;
}

/**
 * Expect a Result to be Err and return the error
 */
export function expectErr<T>(result: Result<T, Error>): Error {
	expect(result.ok).toBe(false);
	if (result.ok) {
		throw new Error("Expected Err but got Ok");
	}
	return result.error;
}
