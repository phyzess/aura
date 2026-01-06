/**
 * Client-side alert service
 * Sends alerts to the server for monitoring
 */

interface AlertPayload {
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

/**
 * Send alerts to the server
 */
export async function sendAlerts(alerts: AlertPayload[]): Promise<void> {
	if (alerts.length === 0) return;

	try {
		const response = await fetch(
			`${import.meta.env.VITE_API_URL}/api/app/alerts`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ alerts }),
			},
		);

		if (!response.ok) {
			console.error("[alerts] Failed to send alerts:", response.statusText);
		}
	} catch (error) {
		console.error("[alerts] Error sending alerts:", error);
	}
}

/**
 * Get device information
 */
export function getDeviceInfo(): {
	browser: string;
	os: string;
	version: string;
} {
	return {
		browser: navigator.userAgent,
		os: navigator.platform,
		version: chrome.runtime.getManifest().version,
	};
}

/**
 * Create an alert
 */
export function createAlert(
	level: "info" | "warning" | "error",
	type: string,
	message: string,
	metrics?: Record<string, unknown>,
): AlertPayload {
	return {
		level,
		type,
		message,
		deviceInfo: getDeviceInfo(),
		metrics,
	};
}

/**
 * Check if we should send an alert
 * Implements client-side rate limiting
 */
export function shouldSendAlert(
	type: string,
	level: "info" | "warning" | "error",
): boolean {
	const key = `alert_sent:${type}`;
	const lastSent = localStorage.getItem(key);

	if (lastSent) {
		const timeSince = Date.now() - Number.parseInt(lastSent, 10);

		// Rate limiting based on level
		const cooldown = {
			error: 3600000, // 1 hour
			warning: 7200000, // 2 hours
			info: 86400000, // 24 hours
		}[level];

		if (timeSince < cooldown) {
			return false;
		}
	}

	// Record this send
	localStorage.setItem(key, Date.now().toString());
	return true;
}
