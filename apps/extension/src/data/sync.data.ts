import { API_ENDPOINTS } from "@aura/config";
import type { User } from "@aura/domain";
import type { Result } from "@aura/shared";
import { tryCatchAsync } from "@aura/shared";
import { API_BASE_URL } from "@/config/env";
import type { SyncPayload } from "@/types";

export interface PushPayload {
	workspaces: unknown[];
	collections: unknown[];
	tabs: unknown[];
	lastSyncTimestamp: number;
}

export interface PullPayload {
	lastSyncTimestamp: number;
}

export type SyncError = "unauthorized" | "network" | "parse" | "unknown";

export const pushToServer = async (
	payload: PushPayload,
): Promise<Result<void, SyncError>> => {
	const result = await tryCatchAsync(
		async () => {
			const res = await fetch(`${API_BASE_URL}/api/app/sync/push`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (res.status === 401) {
				throw new Error("unauthorized");
			}

			if (!res.ok) {
				throw new Error("network");
			}
		},
		(error) => {
			if (error instanceof Error && error.message === "unauthorized") {
				return "unauthorized" as SyncError;
			}
			if (error instanceof Error && error.message === "network") {
				return "network" as SyncError;
			}
			return "unknown" as SyncError;
		},
	);

	return result;
};

export const pullFromServer = async (
	payload: PullPayload,
): Promise<Result<SyncPayload, SyncError>> => {
	const result = await tryCatchAsync(
		async () => {
			const res = await fetch(`${API_BASE_URL}/api/app/sync/pull`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (res.status === 401) {
				throw new Error("unauthorized");
			}

			if (!res.ok) {
				throw new Error("network");
			}

			const data = await res.json();
			return data as SyncPayload;
		},
		(error) => {
			if (error instanceof Error && error.message === "unauthorized") {
				return "unauthorized" as SyncError;
			}
			if (error instanceof Error && error.message === "network") {
				return "network" as SyncError;
			}
			return "parse" as SyncError;
		},
	);

	return result;
};

export const fetchCurrentUser = async (): Promise<
	Result<{ user: User | null }, SyncError>
> => {
	const result = await tryCatchAsync(
		async () => {
			const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.ME}`, {
				method: "GET",
				credentials: "include",
			});

			if (!res.ok) {
				return { user: null };
			}

			const data = await res.json();
			return data as { user: User | null };
		},
		() => "network" as SyncError,
	);

	return result;
};
