import { API_ENDPOINTS } from "@aura/config";
import { atom } from "jotai";
import { authLogger } from "@/config/logger";
import { collectionsAtom } from "@/features/collection/store/atoms";
import { tabsAtom } from "@/features/tab/store/atoms";
import {
	activeWorkspaceIdAtom,
	workspacesAtom,
} from "@/features/workspace/store/atoms";
import { authClient } from "@/services/authClient";
import { cacheService } from "@/services/cache";
import { LocalDB } from "@/services/db";
import { apiClient } from "@/services/http-client";
import type { User } from "@/types";
import { authErrorAtom, authStatusAtom, currentUserAtom } from "./atoms";

export const loadCurrentUserAtom = atom(null, async (_get, set) => {
	try {
		// Try cache first
		const cachedUser = await cacheService.get<User>("USER", "current-user");
		if (cachedUser) {
			authLogger.debug("Using cached user data");
			set(currentUserAtom, cachedUser);
			return;
		}

		// Fetch with deduplication
		const res = await apiClient.fetch(API_ENDPOINTS.USER.ME, {
			method: "GET",
			credentials: "include",
		});

		if (!res.ok) {
			set(currentUserAtom, null);
			return;
		}

		const data = (await res.json()) as { user: User | null };
		const user = data.user ?? null;

		// Cache user data
		if (user) {
			await cacheService.set("USER", "current-user", user);
		}

		set(currentUserAtom, user);
	} catch (error) {
		authLogger.error("Failed to load current user", { error });
		set(currentUserAtom, null);
	}
});

export const signUpAtom = atom(
	null,
	async (
		_get,
		set,
		payload: { name: string; email: string; password: string },
	) => {
		const { error } = await authClient.signUp.email({
			name: payload.name,
			email: payload.email,
			password: payload.password,
		});

		if (error) {
			throw new Error(error.message || "Failed to sign up");
		}

		await set(loadCurrentUserAtom);
	},
);

export const signInAtom = atom(
	null,
	async (_get, set, payload: { email: string; password: string }) => {
		const { error } = await authClient.signIn.email({
			email: payload.email,
			password: payload.password,
		});

		if (error) {
			throw new Error(error.message || "Failed to sign in");
		}

		await set(loadCurrentUserAtom);
	},
);

export const signOutAtom = atom(null, async (get, set) => {
	set(authStatusAtom, "signingOut");
	set(authErrorAtom, null);

	try {
		await authClient.signOut();

		// Clear user cache
		await cacheService.clearAll("USER");
		await cacheService.clearAll("WORKSPACES");
		await cacheService.clearAll("COLLECTIONS");
		await cacheService.clearAll("TABS");

		await set(loadCurrentUserAtom);

		const user = get(currentUserAtom);
		const ok = !user;
		if (!ok) {
			set(authErrorAtom, "Failed to sign out. Please try again.");
		}
		return ok;
	} catch (err) {
		authLogger.error("Sign out failed", { error: err });
		set(
			authErrorAtom,
			"Failed to sign out. Please check your connection and try again.",
		);
		return false;
	} finally {
		set(authStatusAtom, "idle");
	}
});

export const clearLocalDataAtom = atom(null, async (_get, set) => {
	set(workspacesAtom, []);
	set(collectionsAtom, []);
	set(tabsAtom, []);
	set(activeWorkspaceIdAtom, null);

	await LocalDB.clearAll();
});
