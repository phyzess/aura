import toast from "react-hot-toast";
import type { ErrorContext, ErrorType, RetryState } from "./core";
import {
	createRetryState,
	getRetryDelay,
	getUserFriendlyMessage,
	isAuthError,
	isNetworkError,
	logError,
	resetRetry,
	shouldRetry,
	trackRetryAttempt,
} from "./core";

class ErrorHandler {
	private retryState: RetryState;

	constructor() {
		this.retryState = createRetryState();
	}

	async handleError(context: ErrorContext): Promise<void> {
		logError(context);
		this.showErrorToast(context);

		if (context.retryable && context.action) {
			this.retryState = trackRetryAttempt(this.retryState, context.action);
		}
	}

	private showErrorToast(context: ErrorContext): void {
		const message = getUserFriendlyMessage(context);

		toast.error(message, {
			duration: context.retryable ? 5000 : 4000,
		});
	}

	shouldRetry(action: string): boolean {
		return shouldRetry(this.retryState, action);
	}

	getRetryDelay(action: string): number {
		return getRetryDelay(this.retryState, action);
	}

	resetRetry(action: string): void {
		this.retryState = resetRetry(this.retryState, action);
	}

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

	isNetworkError(error: unknown): boolean {
		return isNetworkError(error);
	}

	isAuthError(error: unknown): boolean {
		return isAuthError(error);
	}
}

export const errorHandler = new ErrorHandler();
