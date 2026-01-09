import { TIMEOUT_DURATIONS } from "@aura/config";
import type { Result } from "@aura/shared";
import { tryCatchAsync } from "@aura/shared";

export type OnlineStatusCallback = (isOnline: boolean) => void;

export interface OfflineDetectorState {
	isOnline: boolean;
	callbacks: Set<OnlineStatusCallback>;
	hasShownOfflineToast: boolean;
}

export const createInitialState = (): OfflineDetectorState => ({
	isOnline: navigator.onLine,
	callbacks: new Set(),
	hasShownOfflineToast: false,
});

export const checkConnection = async (): Promise<Result<boolean, Error>> =>
	tryCatchAsync(async () => {
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			TIMEOUT_DURATIONS.CONNECTION_CHECK,
		);

		await fetch("https://www.google.com/favicon.ico", {
			method: "HEAD",
			mode: "no-cors",
			signal: controller.signal,
		});

		clearTimeout(timeoutId);
		return true;
	});

export const notifyCallbacks = (
	callbacks: Set<OnlineStatusCallback>,
	isOnline: boolean,
): void => {
	callbacks.forEach((callback) => {
		try {
			callback(isOnline);
		} catch (error) {
			console.error("[OfflineDetector] Callback error:", error);
		}
	});
};

export const subscribe = (
	state: OfflineDetectorState,
	callback: OnlineStatusCallback,
): (() => void) => {
	state.callbacks.add(callback);
	return () => {
		state.callbacks.delete(callback);
	};
};

export const waitForOnline = async (
	state: OfflineDetectorState,
	timeoutMs: number = TIMEOUT_DURATIONS.WAIT_FOR_ONLINE,
): Promise<boolean> => {
	if (state.isOnline) {
		return true;
	}

	return new Promise((resolve) => {
		const timeout = setTimeout(() => {
			unsubscribe();
			resolve(false);
		}, timeoutMs);

		const unsubscribe = subscribe(state, (isOnline) => {
			if (isOnline) {
				clearTimeout(timeout);
				unsubscribe();
				resolve(true);
			}
		});
	});
};

export const getStatus = (state: OfflineDetectorState): boolean =>
	state.isOnline;

export const setOnline = (
	state: OfflineDetectorState,
): OfflineDetectorState => ({
	...state,
	isOnline: true,
	hasShownOfflineToast: false,
});

export const setOffline = (
	state: OfflineDetectorState,
): OfflineDetectorState => ({
	...state,
	isOnline: false,
});

export const markToastShown = (
	state: OfflineDetectorState,
): OfflineDetectorState => ({
	...state,
	hasShownOfflineToast: true,
});
