import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatLastVisited, getTimeAge } from "../../src/utils/timeUtils";

describe("Time Utils", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
	});

	describe("getTimeAge", () => {
		it("should return fresh for null timestamp", () => {
			const result = getTimeAge(null);

			expect(result.level).toBe("fresh");
			expect(result.label).toBe("");
			expect(result.description).toBe("Never accessed");
		});

		it("should return fresh for undefined timestamp", () => {
			const result = getTimeAge(undefined);

			expect(result.level).toBe("fresh");
			expect(result.label).toBe("");
		});

		it("should return fresh for recent timestamp (< 1 week)", () => {
			const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
			const result = getTimeAge(threeDaysAgo);

			expect(result.level).toBe("fresh");
			expect(result.label).toBe("");
			expect(result.description).toBe("Recently accessed");
		});

		it("should return recent for 1 week old", () => {
			const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
			const result = getTimeAge(oneWeekAgo);

			expect(result.level).toBe("recent");
			expect(result.label).toBe("1w ago");
			expect(result.description).toBe("1 week ago");
		});

		it("should return recent for 2 weeks old", () => {
			const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
			const result = getTimeAge(twoWeeksAgo);

			expect(result.level).toBe("recent");
			expect(result.label).toBe("2w ago");
			expect(result.description).toBe("2 weeks ago");
		});

		it("should return stale for 1 month old", () => {
			const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
			const result = getTimeAge(oneMonthAgo);

			expect(result.level).toBe("stale");
			expect(result.label).toBe("1mo ago");
			expect(result.description).toBe("1 month ago");
		});

		it("should return stale for 2 months old", () => {
			const twoMonthsAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
			const result = getTimeAge(twoMonthsAgo);

			expect(result.level).toBe("stale");
			expect(result.label).toBe("2mo ago");
			expect(result.description).toBe("2 months ago");
		});

		it("should return old for 4 months old", () => {
			const fourMonthsAgo = Date.now() - 120 * 24 * 60 * 60 * 1000;
			const result = getTimeAge(fourMonthsAgo);

			expect(result.level).toBe("old");
			expect(result.label).toBe("4mo ago");
			expect(result.description).toBe("4 months ago");
		});

		it("should return ancient for 7 months old", () => {
			const sevenMonthsAgo = Date.now() - 210 * 24 * 60 * 60 * 1000;
			const result = getTimeAge(sevenMonthsAgo);

			expect(result.level).toBe("ancient");
			expect(result.label).toBe("7mo ago");
			expect(result.description).toBe("7 months ago");
		});

		it("should return ancient for 1 year old", () => {
			const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
			const result = getTimeAge(oneYearAgo);

			expect(result.level).toBe("ancient");
			expect(result.label).toBe("12mo ago");
			expect(result.description).toBe("12 months ago");
		});
	});

	describe("formatLastVisited", () => {
		it("should return 'Never visited' for null timestamp", () => {
			const result = formatLastVisited(null);

			expect(result).toBe("Never visited");
		});

		it("should return 'Never visited' for undefined timestamp", () => {
			const result = formatLastVisited(undefined);

			expect(result).toBe("Never visited");
		});

		it("should format today's timestamp with time", () => {
			const today = new Date("2024-01-15T10:30:00Z").getTime();
			const result = formatLastVisited(today);

			expect(result).toContain("Today at");
		});

		it("should format this year's date without year", () => {
			const thisYear = new Date("2024-01-01T12:00:00Z").getTime();
			const result = formatLastVisited(thisYear);

			expect(result).toContain("Jan");
			expect(result).not.toContain("2024");
		});

		it("should format last year's date with year", () => {
			const lastYear = new Date("2023-12-25T12:00:00Z").getTime();
			const result = formatLastVisited(lastYear);

			expect(result).toContain("2023");
			expect(result).toContain("Dec");
		});

		it("should format old date with full date", () => {
			const oldDate = new Date("2020-06-15T12:00:00Z").getTime();
			const result = formatLastVisited(oldDate);

			expect(result).toContain("2020");
			expect(result).toContain("Jun");
		});
	});
});
