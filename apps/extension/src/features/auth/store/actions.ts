import { API_ENDPOINTS } from "@aura/config";
import { atom } from "jotai";
import { API_BASE_URL } from "@/config/env";
import { authLogger } from "@/config/logger";
import { collectionsAtom } from "@/features/collection/store/atoms";
import { tabsAtom } from "@/features/tab/store/atoms";
import {
	activeWorkspaceIdAtom,
	workspacesAtom,
} from "@/features/workspace/store/atoms";
import { authClient } from "@/services/authClient";
import { LocalDB } from "@/services/db";
import type { User } from "@/types";
import { authErrorAtom, authStatusAtom, currentUserAtom } from "./atoms";

export const loadCurrentUserAtom = atom(null, async (_get, set) => {
	try {
		const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.ME}`, {
			method: "GET",
			credentials: "include",
		});

		if (!res.ok) {
			set(currentUserAtom, null);
			return;
		}

		const data = (await res.json()) as { user: User | null };
		set(currentUserAtom, data.user ?? null);
	} catch {
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
