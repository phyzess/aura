import toast from "react-hot-toast";

export type ErrorType = "network" | "auth" | "sync" | "storage" | "unknown";

export interface ErrorContext {
	type: ErrorType;
	message: string;
	originalError?: Error;
	retryable?: boolean;
	action?: string;
}

class ErrorHandler {
	private retryAttempts = new Map<string, number>();
	private readonly MAX_RETRY_ATTEMPTS = 3;
	private readonly RETRY_DELAYS = [1000, 3000, 5000]; // ms

	/**
	 * Handle an error with appropriate user feedback and retry logic
	 */
	async handleError(context: ErrorContext): Promise<void> {
		console.error(
			`[ErrorHandler] ${context.type}:`,
			context.message,
			context.originalError,
		);

		// Show user-friendly error message
		this.showErrorToast(context);

		// Track retry attempts if retryable
		if (context.retryable && context.action) {
			const attempts = this.retryAttempts.get(context.action) || 0;
			this.retryAttempts.set(context.action, attempts + 1);
		}
	}

	/**
	 * Show appropriate error toast based on error type
	 */
	private showErrorToast(context: ErrorContext): void {
		const message = this.getUserFriendlyMessage(context);

		toast.error(message, {
			duration: context.retryable ? 5000 : 4000,
		});
	}

	/**
	 * Get user-friendly error message with actionable suggestions
	 */
	private getUserFriendlyMessage(context: ErrorContext): string {
		switch (context.type) {
			case "network":
				return this.getNetworkErrorMessage(context);
			case "auth":
				return this.getAuthErrorMessage(context);
			case "sync":
				return this.getSyncErrorMessage(context);
			case "storage":
				return this.getStorageErrorMessage(context);
			default:
				return (
					context.message || "An unexpected error occurred. Please try again."
				);
		}
	}

	private getNetworkErrorMessage(context: ErrorContext): string {
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
	}

	private getAuthErrorMessage(context: ErrorContext): string {
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
	}

	private getSyncErrorMessage(context: ErrorContext): string {
		if (context.message) {
			return `${context.message} Your changes are saved locally and will sync when connection is restored.`;
		}
		return "Sync failed. Your changes are saved locally and will sync automatically.";
	}

	private getStorageErrorMessage(context: ErrorContext): string {
		if (context.originalError?.message.includes("quota")) {
			return "Storage quota exceeded. Please free up some space by removing old tabs or collections.";
		}
		if (context.originalError?.message.includes("permission")) {
			return "Storage permission denied. Please check browser settings and allow storage access.";
		}
		return "Storage error. Please try again or restart the extension.";
	}

	/**
	 * Check if an action should be retried
	 */
	shouldRetry(action: string): boolean {
		const attempts = this.retryAttempts.get(action) || 0;
		return attempts < this.MAX_RETRY_ATTEMPTS;
	}

	/**
	 * Get retry delay for an action
	 */
	getRetryDelay(action: string): number {
		const attempts = this.retryAttempts.get(action) || 0;
		return this.RETRY_DELAYS[Math.min(attempts, this.RETRY_DELAYS.length - 1)];
	}

	/**
	 * Reset retry attempts for an action
	 */
	resetRetry(action: string): void {
		this.retryAttempts.delete(action);
	}

	/**
	 * Execute an action with automatic retry logic
	 */
	async withRetry<T>(
		action: string,
		fn: () => Promise<T>,
		errorType: ErrorType = "unknown",
	): Promise<T> {
		try {
			const result = await fn();
			this.resetRetry(action);
			return result;
		} catch (error) {
			const context: ErrorContext = {
				type: errorType,
				message: error instanceof Error ? error.message : "Unknown error",
				originalError: error instanceof Error ? error : undefined,
				retryable: true,
				action,
			};

			await this.handleError(context);

			if (this.shouldRetry(action)) {
				const delay = this.getRetryDelay(action);
				await new Promise((resolve) => setTimeout(resolve, delay));
				return this.withRetry(action, fn, errorType);
			}

			throw error;
		}
	}

	/**
	 * Check if error is a network error
	 */
	isNetworkError(error: unknown): boolean {
		if (error instanceof Error) {
			return (
				error.message.includes("fetch") ||
				error.message.includes("network") ||
				error.message.includes("Failed to fetch") ||
				error.name === "NetworkError"
			);
		}
		return false;
	}

	/**
	 * Check if error is an auth error
	 */
	isAuthError(error: unknown): boolean {
		if (error instanceof Error) {
			return (
				error.message.includes("401") ||
				error.message.includes("unauthorized") ||
				error.message.includes("authentication")
			);
		}
		return false;
	}
}

export const errorHandler = new ErrorHandler();
