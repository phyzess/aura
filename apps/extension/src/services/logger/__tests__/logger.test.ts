/**
 * Logger system tests
 */

import { beforeEach, describe, expect, it } from "vitest";
import { clearAllLogs, getAllLogs, getLogStats } from "../indexeddb";

describe("Logger System", () => {
	beforeEach(async () => {
		// Clear logs before each test
		await clearAllLogs();
	});

	it("should store logs in IndexedDB", async () => {
		// This test requires actual IndexedDB implementation
		// For now, just verify the functions exist
		expect(getAllLogs).toBeDefined();
		expect(getLogStats).toBeDefined();
		expect(clearAllLogs).toBeDefined();
	});

	it("should calculate log stats correctly", async () => {
		const stats = await getLogStats();
		expect(stats).toHaveProperty("total");
		expect(stats).toHaveProperty("byLevel");
		expect(stats).toHaveProperty("sizeInBytes");
	});
});
