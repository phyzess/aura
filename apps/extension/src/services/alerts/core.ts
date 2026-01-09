import { ALERT_COOLDOWN } from "@aura/config";
import type { Result } from "@aura/shared";
import { ok, tryCatchAsync } from "@aura/shared";

export interface AlertPayload {
	level: "info" | "warning" | "error";
	type: string;
	message: string;
	deviceInfo?: {
		browser: string;
		os: string;
		version: string;
	};
	metrics?: Record<string, unknown>;
}

export const getDeviceInfo = (): {
	browser: string;
	os: string;
	version: string;
} => ({
	browser: navigator.userAgent,
	os: navigator.platform,
	version: chrome.runtime.getManifest().version,
});

export const createAlert = (
	level: "info" | "warning" | "error",
	type: string,
	message: string,
	metrics?: Record<string, unknown>,
): AlertPayload => ({
	level,
	type,
	message,
	deviceInfo: getDeviceInfo(),
	metrics,
});

const COOLDOWN_MS = {
	error: ALERT_COOLDOWN.ERROR,
	warning: ALERT_COOLDOWN.WARNING,
	info: ALERT_COOLDOWN.INFO,
};

export const shouldSendAlert = (
	type: string,
	level: "info" | "warning" | "error",
): boolean => {
	const key = `alert_sent:${type}`;
	const lastSent = localStorage.getItem(key);

	if (lastSent) {
		const timeSince = Date.now() - Number.parseInt(lastSent, 10);
		const cooldown = COOLDOWN_MS[level];

		if (timeSince < cooldown) {
			return false;
		}
	}

	localStorage.setItem(key, Date.now().toString());
	return true;
};

export const sendAlerts = async (
	alerts: AlertPayload[],
	apiUrl: string,
): Promise<Result<void, Error>> => {
	if (alerts.length === 0) return ok(undefined);

	return tryCatchAsync(async () => {
		const response = await fetch(`${apiUrl}/api/app/alerts`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({ alerts }),
		});

		if (!response.ok) {
			throw new Error(`Failed to send alerts: ${response.statusText}`);
		}
	});
};

export const filterAlertsByCooldown = (
	alerts: AlertPayload[],
): AlertPayload[] =>
	alerts.filter((alert) => shouldSendAlert(alert.type, alert.level));

export const groupAlertsByLevel = (
	alerts: AlertPayload[],
): Record<string, AlertPayload[]> => {
	const groups: Record<string, AlertPayload[]> = {
		error: [],
		warning: [],
		info: [],
	};

	for (const alert of alerts) {
		groups[alert.level].push(alert);
	}

	return groups;
};
