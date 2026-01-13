/**
 * Shared constants across the application
 */

// ========== Data Layer Constants ==========
export const DATA_LAYER_CONSTANTS = {
	BATCH_SIZE: {
		WORKSPACE: 10,
		COLLECTION: 10,
		TAB: 8,
		DELETE: 80,
	},
} as const;

// ========== Application URLs ==========
export const APP_URLS = {
	GITHUB_REPO: "https://github.com/phyzess/aura",
	DOCUMENTATION: "https://github.com/phyzess/aura/blob/main/README.md",
} as const;

// ========== Cache Durations (in milliseconds) ==========
export const CACHE_DURATIONS = {
	// API Response Caching
	USER: 5 * 60 * 1000, // 5 minutes - user data changes infrequently
	WORKSPACES: 2 * 60 * 1000, // 2 minutes - workspace list
	COLLECTIONS: 2 * 60 * 1000, // 2 minutes - collection list
	TABS: 30 * 1000, // 30 seconds - tabs change frequently

	// Link Checking
	LINK_CHECK: 24 * 60 * 60 * 1000, // 24 hours

	// Session
	SESSION: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

// ========== Timeout Durations (in milliseconds) ==========
export const TIMEOUT_DURATIONS = {
	LINK_CHECK_REQUEST: 10000, // 10 seconds
	CONNECTION_CHECK: 5000, // 5 seconds
	WAIT_FOR_ONLINE: 30000, // 30 seconds
} as const;

// ========== Retry Configuration ==========
export const RETRY_CONFIG = {
	MAX_ATTEMPTS: 3,
	DELAYS: [1000, 3000, 5000], // milliseconds
} as const;

// ========== Alert Cooldown (in milliseconds) ==========
export const ALERT_COOLDOWN = {
	ERROR: 3600000, // 1 hour
	WARNING: 7200000, // 2 hours
	INFO: 86400000, // 24 hours
} as const;

// ========== Link Check Configuration ==========
export const LINK_CHECK_CONFIG = {
	MAX_CONCURRENT: 5, // Max concurrent requests
} as const;

// ========== Sync Constants ==========
export const SYNC_CONSTANTS = {
	AUTO_SYNC_DELAY: 5000, // 5 seconds
	RETRY_DELAY: 1000, // 1 second
	MAX_RETRIES: 3,
} as const;

// ========== Storage Keys ==========
export const STORAGE_KEYS = {
	// Data
	WORKSPACES: "workspaces",
	COLLECTIONS: "collections",
	TABS: "tabs",
	LAST_SYNC_TIMESTAMP: "lastSyncTimestamp",

	// User Preferences
	THEME: "aura-theme",
	LOCALE: "aura-locale",

	// Onboarding & Setup
	ONBOARDING_COMPLETED: "aura-onboarding-completed",
	NEWTAB_ENABLED: "aura-newtab-enabled",

	// Version & Changelog
	LAST_VERSION: "aura-last-version",
	CHANGELOG_SEEN: "aura-changelog-seen",

	// Save Request (Context Menu)
	SAVE_REQUEST: "aura-save-request",
} as const;

// ========== Context Menu IDs ==========
export const CONTEXT_MENU_IDS = {
	MAIN: "aura-main",
	SAVE_CURRENT_TAB: "save-current-tab",
	SAVE_LINK: "save-link",
	SAVE_ALL_TABS: "save-all-tabs",
	SEPARATOR_1: "separator-1",
	OPEN_DASHBOARD: "open-dashboard",
} as const;

// ========== Message Types ==========
export const MESSAGE_TYPES = {
	ONBOARDING_COMPLETE: "onboarding-complete",
} as const;

// ========== Default Values ==========
export const DEFAULT_VALUES = {
	UNTITLED_TAB: "Untitled",
	SAVED_LINK_TITLE: "Saved Link",
	CHROME_URL_PREFIX: "chrome://",
} as const;

// ========== API Endpoints ==========
export const API_ENDPOINTS = {
	SYNC: {
		PUSH: "/api/app/sync/push",
		PULL: "/api/app/sync/pull",
	},
	USER: {
		ME: "/api/app/me",
	},
	AUTH: {
		VERIFY_TURNSTILE: "/api/auth/verify-turnstile",
		EMAIL_SEND_CODE: "/api/auth/email/send-code",
		EMAIL_VERIFY_CODE: "/api/auth/email/verify-code",
	},
} as const;

// ========== Type Exports ==========
export type DataLayerConstants = typeof DATA_LAYER_CONSTANTS;
export type AppUrls = typeof APP_URLS;
export type CacheDurations = typeof CACHE_DURATIONS;
export type TimeoutDurations = typeof TIMEOUT_DURATIONS;
export type RetryConfig = typeof RETRY_CONFIG;
export type AlertCooldown = typeof ALERT_COOLDOWN;
export type LinkCheckConfig = typeof LINK_CHECK_CONFIG;
export type SyncConstants = typeof SYNC_CONSTANTS;
export type StorageKeys = typeof STORAGE_KEYS;
