import { API_ENDPOINTS } from "@aura/config";
import type { User } from "@aura/domain";
import { getExtensionLogger } from "@/config/logger";
import { cacheService } from "@/services/cache";
import { apiClient } from "@/services/http-client";

const logger = getExtensionLogger(["preload"]);

/**
 * Preload user data in background
 * This runs when extension starts or user logs in
 */
export const preloadUserData = async (): Promise<void> => {
	try {
		logger.debug("Preloading user data");

		const response = await apiClient.fetch(API_ENDPOINTS.USER.ME, {
			method: "GET",
			credentials: "include",
		});

		if (!response.ok) {
			// User not authenticated - this is normal, not an error
			logger.debug("User not authenticated, skipping preload");
			return;
		}

		const data = (await response.json()) as { user: User | null };
		if (data.user) {
			// Cache user data
			await cacheService.set("USER", "current-user", data.user);
			logger.debug("User data preloaded and cached", { userId: data.user.id });
		}
	} catch (error) {
		// Network errors or other issues - log as debug, not error
		// This is expected when user is not logged in or network is unavailable
		logger.debug("Could not preload user data", { error });
	}
};

/**
 * Preload workspace list in background
 * This runs after user data is loaded
 */
export const preloadWorkspaces = async (): Promise<void> => {
	try {
		logger.debug("Preloading workspaces");

		// Check if user is authenticated first
		const user = await cacheService.get("USER", "current-user");
		if (!user) {
			logger.debug("No user found, skipping workspace preload");
			return;
		}

		// Load workspaces from IndexedDB (already available locally)
		const { LocalDB, initDB } = await import("@/services/db");
		await initDB();

		const workspaces = await LocalDB.getWorkspaces();
		const activeWorkspaces = workspaces.filter((w) => !w.deletedAt);

		// Cache workspace list
		await cacheService.set("WORKSPACES", "list", activeWorkspaces);
		logger.debug("Workspaces preloaded and cached", {
			count: activeWorkspaces.length,
		});
	} catch (error) {
		logger.debug("Could not preload workspaces", { error });
	}
};

/**
 * Preload all data in background
 * Called on extension startup
 */
export const preloadAll = async (): Promise<void> => {
	logger.debug("Starting background preload");

	// Preload user data first
	await preloadUserData();

	// Then preload workspaces
	await preloadWorkspaces();

	logger.debug("Background preload complete");
};
