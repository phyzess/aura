/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
	// Success
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,

	// Client Errors
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,

	// Server Errors
	INTERNAL_SERVER_ERROR: 500,
	SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

/**
 * Standard Error Messages
 */
export const ERROR_MESSAGES = {
	// Authentication & Authorization
	UNAUTHORIZED: "Unauthorized",
	SESSION_EXPIRED: "Session expired. Please sign in again to continue.",
	ACCESS_DENIED: "Access denied. You don't have permission for this action.",
	INVALID_CREDENTIALS: "Invalid email or password. Please check and try again.",
	AUTH_FAILED: "Authentication failed. Please sign in again.",

	// Network & Connection
	NETWORK_ERROR: "Network connection issue",
	NETWORK_TIMEOUT: "The request timed out. Try again in a moment.",
	NETWORK_UNREACHABLE:
		"Unable to reach server. Check your internet connection.",
	FAILED_TO_FETCH: "Failed to fetch data from server",

	// Validation
	INVALID_PAYLOAD: "Invalid payload",
	INVALID_INPUT: "Invalid input data",
	MISSING_REQUIRED_FIELD: "Missing required field",

	// Sync
	SYNC_FAILED:
		"Sync failed. Your changes are saved locally and will sync automatically.",
	SYNC_CONFLICT: "Sync conflict detected",

	// Storage
	STORAGE_ERROR: "Storage error. Please try again or restart the extension.",
	STORAGE_QUOTA_EXCEEDED:
		"Storage quota exceeded. Please free up some space by removing old tabs or collections.",
	STORAGE_PERMISSION_DENIED:
		"Storage permission denied. Please check browser settings and allow storage access.",

	// Generic
	INTERNAL_ERROR: "Internal server error",
	UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
	NOT_FOUND: "Resource not found",
} as const;

export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];

/**
 * Error Response Builder
 */
export interface ErrorResponse {
	error: string;
	message?: string;
	details?: unknown;
}

export const createErrorResponse = (
	error: string,
	message?: string,
	details?: unknown,
): ErrorResponse => {
	const response: ErrorResponse = { error };
	if (message) response.message = message;
	if (details) response.details = details;
	return response;
};

/**
 * Common Error Responses
 */
export const COMMON_ERROR_RESPONSES = {
	unauthorized: () =>
		createErrorResponse(
			ERROR_MESSAGES.UNAUTHORIZED,
			ERROR_MESSAGES.AUTH_FAILED,
		),
	invalidPayload: (details?: unknown) =>
		createErrorResponse(ERROR_MESSAGES.INVALID_PAYLOAD, undefined, details),
	internalError: (message?: string) =>
		createErrorResponse(
			ERROR_MESSAGES.INTERNAL_ERROR,
			message || ERROR_MESSAGES.UNKNOWN_ERROR,
		),
	notFound: (resource?: string) =>
		createErrorResponse(
			ERROR_MESSAGES.NOT_FOUND,
			resource ? `${resource} not found` : undefined,
		),
} as const;
