import { describe, expect, it } from "vitest";
import {
	createRetryState,
	type ErrorContext,
	getRetryDelay,
	getUserFriendlyMessage,
	isAuthError,
	isNetworkError,
	resetRetry,
	shouldRetry,
	trackRetryAttempt,
} from "@/services/errorHandler/core";

describe("errorHandler/core", () => {
	describe("createRetryState", () => {
		it("should create initial retry state", () => {
			const state = createRetryState();

			expect(state.attempts.size).toBe(0);
			expect(state.maxAttempts).toBe(3);
			expect(state.delays).toEqual([1000, 3000, 5000]);
		});
	});

	describe("getUserFriendlyMessage", () => {
		it("should return network error message for timeout", () => {
			const context: ErrorContext = {
				type: "network",
				message: "Network error",
				originalError: new Error("timeout"),
			};

			const message = getUserFriendlyMessage(context);

			expect(message).toContain("Network connection issue");
			expect(message).toContain("timed out");
		});

		it("should return network error message for fetch failure", () => {
			const context: ErrorContext = {
				type: "network",
				message: "Network error",
				originalError: new Error("Failed to fetch"),
			};

			const message = getUserFriendlyMessage(context);

			expect(message).toContain("Network connection issue");
			expect(message).toContain("Unable to reach server");
		});

		it("should return auth error message for 401", () => {
			const context: ErrorContext = {
				type: "auth",
				message: "Auth error",
				originalError: new Error("401"),
			};

			const message = getUserFriendlyMessage(context);

			expect(message).toContain("Session expired");
		});

		it("should return auth error message for 403", () => {
			const context: ErrorContext = {
				type: "auth",
				message: "Auth error",
				originalError: new Error("403"),
			};

			const message = getUserFriendlyMessage(context);

			expect(message).toContain("Access denied");
		});

		it("should return sync error message", () => {
			const context: ErrorContext = {
				type: "sync",
				message: "Sync failed",
			};

			const message = getUserFriendlyMessage(context);

			expect(message).toContain("Sync failed");
			expect(message).toContain("saved locally");
		});

		it("should return storage error message for quota", () => {
			const context: ErrorContext = {
				type: "storage",
				message: "Storage error",
				originalError: new Error("quota exceeded"),
			};

			const message = getUserFriendlyMessage(context);

			expect(message).toContain("Storage quota exceeded");
		});

		it("should return default message for unknown error", () => {
			const context: ErrorContext = {
				type: "unknown",
				message: "Something went wrong",
			};

			const message = getUserFriendlyMessage(context);

			expect(message).toBe("Something went wrong");
		});
	});

	describe("trackRetryAttempt", () => {
		it("should track first attempt", () => {
			const state = createRetryState();
			const newState = trackRetryAttempt(state, "sync");

			expect(newState.attempts.get("sync")).toBe(1);
		});

		it("should increment attempt count", () => {
			let state = createRetryState();
			state = trackRetryAttempt(state, "sync");
			state = trackRetryAttempt(state, "sync");

			expect(state.attempts.get("sync")).toBe(2);
		});

		it("should track multiple actions independently", () => {
			let state = createRetryState();
			state = trackRetryAttempt(state, "sync");
			state = trackRetryAttempt(state, "fetch");

			expect(state.attempts.get("sync")).toBe(1);
			expect(state.attempts.get("fetch")).toBe(1);
		});
	});

	describe("shouldRetry", () => {
		it("should allow retry when under max attempts", () => {
			const state = createRetryState();

			expect(shouldRetry(state, "sync")).toBe(true);
		});

		it("should not allow retry when at max attempts", () => {
			let state = createRetryState();
			state = trackRetryAttempt(state, "sync");
			state = trackRetryAttempt(state, "sync");
			state = trackRetryAttempt(state, "sync");

			expect(shouldRetry(state, "sync")).toBe(false);
		});
	});

	describe("getRetryDelay", () => {
		it("should return first delay for no attempts", () => {
			const state = createRetryState();

			expect(getRetryDelay(state, "sync")).toBe(1000);
		});

		it("should return second delay for first attempt", () => {
			let state = createRetryState();
			state = trackRetryAttempt(state, "sync");

			expect(getRetryDelay(state, "sync")).toBe(3000);
		});

		it("should return third delay for second attempt", () => {
			let state = createRetryState();
			state = trackRetryAttempt(state, "sync");
			state = trackRetryAttempt(state, "sync");

			expect(getRetryDelay(state, "sync")).toBe(5000);
		});

		it("should return last delay when exceeding delays array", () => {
			let state = createRetryState();
			state = trackRetryAttempt(state, "sync");
			state = trackRetryAttempt(state, "sync");
			state = trackRetryAttempt(state, "sync");
			state = trackRetryAttempt(state, "sync");

			expect(getRetryDelay(state, "sync")).toBe(5000);
		});
	});

	describe("resetRetry", () => {
		it("should reset retry attempts for action", () => {
			let state = createRetryState();
			state = trackRetryAttempt(state, "sync");
			state = trackRetryAttempt(state, "sync");

			state = resetRetry(state, "sync");

			expect(state.attempts.get("sync")).toBeUndefined();
		});

		it("should not affect other actions", () => {
			let state = createRetryState();
			state = trackRetryAttempt(state, "sync");
			state = trackRetryAttempt(state, "fetch");

			state = resetRetry(state, "sync");

			expect(state.attempts.get("sync")).toBeUndefined();
			expect(state.attempts.get("fetch")).toBe(1);
		});
	});

	describe("isNetworkError", () => {
		it("should detect fetch error", () => {
			const error = new Error("Failed to fetch");

			expect(isNetworkError(error)).toBe(true);
		});

		it("should detect network error", () => {
			const error = new Error("network timeout");

			expect(isNetworkError(error)).toBe(true);
		});

		it("should detect NetworkError by name", () => {
			const error = new Error("Something");
			error.name = "NetworkError";

			expect(isNetworkError(error)).toBe(true);
		});

		it("should return false for non-network error", () => {
			const error = new Error("Something else");

			expect(isNetworkError(error)).toBe(false);
		});

		it("should return false for non-Error objects", () => {
			expect(isNetworkError("error")).toBe(false);
			expect(isNetworkError(null)).toBe(false);
		});
	});

	describe("isAuthError", () => {
		it("should detect 401 error", () => {
			const error = new Error("401 Unauthorized");

			expect(isAuthError(error)).toBe(true);
		});

		it("should detect unauthorized error", () => {
			const error = new Error("unauthorized access");

			expect(isAuthError(error)).toBe(true);
		});

		it("should detect authentication error", () => {
			const error = new Error("authentication failed");

			expect(isAuthError(error)).toBe(true);
		});

		it("should return false for non-auth error", () => {
			const error = new Error("Something else");

			expect(isAuthError(error)).toBe(false);
		});

		it("should return false for non-Error objects", () => {
			expect(isAuthError("error")).toBe(false);
			expect(isAuthError(null)).toBe(false);
		});
	});
});
