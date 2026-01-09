import { RETRY_CONFIG } from "@aura/config";

export type ErrorType = "network" | "auth" | "sync" | "storage" | "unknown";

export interface ErrorContext {
	type: ErrorType;
	message: string;
	originalError?: Error;
	retryable?: boolean;
	action?: string;
}

export interface RetryState {
	attempts: Map<string, number>;
	maxAttempts: number;
	delays: number[];
}

export const createRetryState = (): RetryState => ({
	attempts: new Map(),
	maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
	delays: [...RETRY_CONFIG.DELAYS],
});

export const getUserFriendlyMessage = (context: ErrorContext): string => {
	switch (context.type) {
		case "network":
			return getNetworkErrorMessage(context);
		case "auth":
			return getAuthErrorMessage(context);
		case "sync":
			return getSyncErrorMessage(context);
		case "storage":
			return getStorageErrorMessage(context);
		default:
			return (
				context.message || "An unexpected error occurred. Please try again."
			);
	}
};

const getNetworkErrorMessage = (context: ErrorContext): string => {
	const baseMsg = "Network connection issue";
	const suggestions = [];

	if (context.originalError?.message.includes("timeout")) {
		suggestions.push("The request timed out");
		suggestions.push("Try again in a moment");
	} else if (context.originalError?.message.includes("Failed to fetch")) {
		suggestions.push("Unable to reach server");
		suggestions.push("Check your internet connection");
	} else {
		suggestions.push("Check your connection and try again");
	}

	return `${baseMsg}. ${suggestions.join(". ")}.`;
};

const getAuthErrorMessage = (context: ErrorContext): string => {
	if (context.originalError?.message.includes("401")) {
		return "Session expired. Please sign in again to continue.";
	}
	if (context.originalError?.message.includes("403")) {
		return "Access denied. You don't have permission for this action.";
	}
	if (context.originalError?.message.includes("invalid credentials")) {
		return "Invalid email or password. Please check and try again.";
	}
	return "Authentication failed. Please sign in again.";
};

const getSyncErrorMessage = (context: ErrorContext): string => {
	if (context.message) {
		return `${context.message} Your changes are saved locally and will sync when connection is restored.`;
	}
	return "Sync failed. Your changes are saved locally and will sync automatically.";
};

const getStorageErrorMessage = (context: ErrorContext): string => {
	if (context.originalError?.message.includes("quota")) {
		return "Storage quota exceeded. Please free up some space by removing old tabs or collections.";
	}
	if (context.originalError?.message.includes("permission")) {
		return "Storage permission denied. Please check browser settings and allow storage access.";
	}
	return "Storage error. Please try again or restart the extension.";
};

export const trackRetryAttempt = (
	state: RetryState,
	action: string,
): RetryState => {
	const attempts = state.attempts.get(action) || 0;
	const newAttempts = new Map(state.attempts);
	newAttempts.set(action, attempts + 1);
	return { ...state, attempts: newAttempts };
};

export const shouldRetry = (state: RetryState, action: string): boolean => {
	const attempts = state.attempts.get(action) || 0;
	return attempts < state.maxAttempts;
};

export const getRetryDelay = (state: RetryState, action: string): number => {
	const attempts = state.attempts.get(action) || 0;
	return state.delays[Math.min(attempts, state.delays.length - 1)];
};

export const resetRetry = (state: RetryState, action: string): RetryState => {
	const newAttempts = new Map(state.attempts);
	newAttempts.delete(action);
	return { ...state, attempts: newAttempts };
};

export const isNetworkError = (error: unknown): boolean => {
	if (error instanceof Error) {
		return (
			error.message.includes("fetch") ||
			error.message.includes("network") ||
			error.message.includes("Failed to fetch") ||
			error.name === "NetworkError"
		);
	}
	return false;
};

export const isAuthError = (error: unknown): boolean => {
	if (error instanceof Error) {
		return (
			error.message.includes("401") ||
			error.message.includes("unauthorized") ||
			error.message.includes("authentication")
		);
	}
	return false;
};

export const logError = (context: ErrorContext): void => {
	console.error(
		`[ErrorHandler] ${context.type}:`,
		context.message,
		context.originalError,
	);
};
