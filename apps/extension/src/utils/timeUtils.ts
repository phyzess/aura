export type TimeAgeLevel = "fresh" | "recent" | "stale" | "old" | "ancient";

export interface TimeAgeInfo {
	level: TimeAgeLevel;
	label: string;
	description: string;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Calculate how old a timestamp is and return age level and label
 */
export function getTimeAge(timestamp: number | null | undefined): TimeAgeInfo {
	if (!timestamp) {
		return {
			level: "fresh",
			label: "",
			description: "Never accessed",
		};
	}

	const now = Date.now();
	const age = now - timestamp;

	// < 1 week: fresh (no indicator)
	if (age < WEEK_MS) {
		return {
			level: "fresh",
			label: "",
			description: "Recently accessed",
		};
	}

	// 1 week - 1 month: recent (subtle indicator)
	if (age < MONTH_MS) {
		const weeks = Math.floor(age / WEEK_MS);
		return {
			level: "recent",
			label: `${weeks}w ago`,
			description: `${weeks} week${weeks > 1 ? "s" : ""} ago`,
		};
	}

	// 1-3 months: stale (yellow indicator)
	if (age < 3 * MONTH_MS) {
		const months = Math.floor(age / MONTH_MS);
		return {
			level: "stale",
			label: `${months}mo ago`,
			description: `${months} month${months > 1 ? "s" : ""} ago`,
		};
	}

	// 3-6 months: old (orange indicator)
	if (age < 6 * MONTH_MS) {
		const months = Math.floor(age / MONTH_MS);
		return {
			level: "old",
			label: `${months}mo ago`,
			description: `${months} month${months > 1 ? "s" : ""} ago`,
		};
	}

	// > 6 months: ancient (red indicator)
	const months = Math.floor(age / MONTH_MS);
	return {
		level: "ancient",
		label: `${months}mo ago`,
		description: `${months} month${months > 1 ? "s" : ""} ago`,
	};
}

/**
 * Format a timestamp to a readable date string
 */
export function formatLastVisited(timestamp: number | null | undefined): string {
	if (!timestamp) return "Never visited";

	const date = new Date(timestamp);
	const now = new Date();

	// If today, show time
	if (date.toDateString() === now.toDateString()) {
		return `Today at ${date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		})}`;
	}

	// If this year, show month and day
	if (date.getFullYear() === now.getFullYear()) {
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	}

	// Otherwise show full date
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

