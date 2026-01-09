import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAlert, shouldSendAlert } from "@/services/alerts/core";

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(global, "localStorage", {
	value: localStorageMock,
});

// Mock chrome runtime
global.chrome = {
	runtime: {
		getManifest: () => ({ version: "1.0.0" }),
	},
} as any;

describe("alerts/core", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	describe("createAlert", () => {
		it("should create alert with all fields", () => {
			const alert = createAlert("error", "sync_failed", "Sync failed", {
				attempts: 3,
			});

			expect(alert.level).toBe("error");
			expect(alert.type).toBe("sync_failed");
			expect(alert.message).toBe("Sync failed");
			expect(alert.metrics).toEqual({ attempts: 3 });
			expect(alert.deviceInfo).toBeDefined();
			expect(alert.deviceInfo?.version).toBe("1.0.0");
		});

		it("should create alert without metrics", () => {
			const alert = createAlert("info", "user_action", "User clicked button");

			expect(alert.level).toBe("info");
			expect(alert.type).toBe("user_action");
			expect(alert.message).toBe("User clicked button");
			expect(alert.metrics).toBeUndefined();
		});
	});

	describe("shouldSendAlert", () => {
		it("should allow first alert", () => {
			const result = shouldSendAlert("sync_failed", "error");

			expect(result).toBe(true);
		});

		it("should block duplicate alert within cooldown period", () => {
			const now = Date.now();
			localStorage.setItem("alert_sent:sync_failed", now.toString());

			const result = shouldSendAlert("sync_failed", "error");

			expect(result).toBe(false);
		});

		it("should allow alert after cooldown period for error", () => {
			const oneHourAgo = Date.now() - 3600001; // 1 hour + 1ms
			localStorage.setItem("alert_sent:sync_failed", oneHourAgo.toString());

			const result = shouldSendAlert("sync_failed", "error");

			expect(result).toBe(true);
		});

		it("should allow alert after cooldown period for warning", () => {
			const twoHoursAgo = Date.now() - 7200001; // 2 hours + 1ms
			localStorage.setItem("alert_sent:slow_sync", twoHoursAgo.toString());

			const result = shouldSendAlert("slow_sync", "warning");

			expect(result).toBe(true);
		});

		it("should allow alert after cooldown period for info", () => {
			const oneDayAgo = Date.now() - 86400001; // 24 hours + 1ms
			localStorage.setItem("alert_sent:user_login", oneDayAgo.toString());

			const result = shouldSendAlert("user_login", "info");

			expect(result).toBe(true);
		});

		it("should track different alert types independently", () => {
			shouldSendAlert("sync_failed", "error");
			const result = shouldSendAlert("auth_failed", "error");

			expect(result).toBe(true);
		});

		it("should update timestamp when sending alert", () => {
			const before = Date.now();
			shouldSendAlert("sync_failed", "error");
			const after = Date.now();

			const stored = localStorage.getItem("alert_sent:sync_failed");
			const timestamp = Number.parseInt(stored!, 10);

			expect(timestamp).toBeGreaterThanOrEqual(before);
			expect(timestamp).toBeLessThanOrEqual(after);
		});
	});
});

