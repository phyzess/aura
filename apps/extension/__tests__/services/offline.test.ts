import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createInitialState,
	getStatus,
	markToastShown,
	notifyCallbacks,
	setOffline,
	setOnline,
	subscribe,
	type OfflineDetectorState,
	type OnlineStatusCallback,
} from "@/services/offline/core";

describe("offline/core", () => {
	describe("createInitialState", () => {
		it("should create initial state with navigator.onLine", () => {
			const state = createInitialState();

			expect(state.isOnline).toBe(navigator.onLine);
			expect(state.callbacks.size).toBe(0);
			expect(state.hasShownOfflineToast).toBe(false);
		});
	});

	describe("getStatus", () => {
		it("should return online status", () => {
			const state: OfflineDetectorState = {
				isOnline: true,
				callbacks: new Set(),
				hasShownOfflineToast: false,
			};

			expect(getStatus(state)).toBe(true);
		});

		it("should return offline status", () => {
			const state: OfflineDetectorState = {
				isOnline: false,
				callbacks: new Set(),
				hasShownOfflineToast: false,
			};

			expect(getStatus(state)).toBe(false);
		});
	});

	describe("setOnline", () => {
		it("should set online status", () => {
			const state: OfflineDetectorState = {
				isOnline: false,
				callbacks: new Set(),
				hasShownOfflineToast: true,
			};

			const newState = setOnline(state);

			expect(newState.isOnline).toBe(true);
			expect(newState.hasShownOfflineToast).toBe(false);
		});

		it("should not mutate original state", () => {
			const state: OfflineDetectorState = {
				isOnline: false,
				callbacks: new Set(),
				hasShownOfflineToast: true,
			};

			setOnline(state);

			expect(state.isOnline).toBe(false);
			expect(state.hasShownOfflineToast).toBe(true);
		});
	});

	describe("setOffline", () => {
		it("should set offline status", () => {
			const state: OfflineDetectorState = {
				isOnline: true,
				callbacks: new Set(),
				hasShownOfflineToast: false,
			};

			const newState = setOffline(state);

			expect(newState.isOnline).toBe(false);
		});

		it("should not mutate original state", () => {
			const state: OfflineDetectorState = {
				isOnline: true,
				callbacks: new Set(),
				hasShownOfflineToast: false,
			};

			setOffline(state);

			expect(state.isOnline).toBe(true);
		});
	});

	describe("markToastShown", () => {
		it("should mark toast as shown", () => {
			const state: OfflineDetectorState = {
				isOnline: false,
				callbacks: new Set(),
				hasShownOfflineToast: false,
			};

			const newState = markToastShown(state);

			expect(newState.hasShownOfflineToast).toBe(true);
		});
	});

	describe("subscribe", () => {
		it("should add callback to state", () => {
			const state = createInitialState();
			const callback: OnlineStatusCallback = vi.fn();

			subscribe(state, callback);

			expect(state.callbacks.has(callback)).toBe(true);
		});

		it("should return unsubscribe function", () => {
			const state = createInitialState();
			const callback: OnlineStatusCallback = vi.fn();

			const unsubscribe = subscribe(state, callback);
			unsubscribe();

			expect(state.callbacks.has(callback)).toBe(false);
		});
	});

	describe("notifyCallbacks", () => {
		it("should call all callbacks with status", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();
			const callbacks = new Set([callback1, callback2]);

			notifyCallbacks(callbacks, true);

			expect(callback1).toHaveBeenCalledWith(true);
			expect(callback2).toHaveBeenCalledWith(true);
		});

		it("should handle callback errors gracefully", () => {
			const errorCallback = vi.fn(() => {
				throw new Error("Callback error");
			});
			const normalCallback = vi.fn();
			const callbacks = new Set([errorCallback, normalCallback]);

			expect(() => notifyCallbacks(callbacks, true)).not.toThrow();
			expect(normalCallback).toHaveBeenCalledWith(true);
		});
	});
});

