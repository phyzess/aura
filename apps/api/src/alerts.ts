import type { Env } from "./index";

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
 * Send email notification using Cloudflare Email Workers
 * Requires: Email Routing configured in Cloudflare Dashboard
 */
export async function sendEmailAlert(
	env: Env,
	alert: AlertPayload & { userId: string },
): Promise<void> {
	// 只发送 error 级别的告警
	if (alert.level !== "error") {
		return;
	}

	const emailContent = `
From: Aura Alerts <alerts@${env.EMAIL_DOMAIN || "aura.app"}>
To: ${env.ALERT_EMAIL || "zimm.yu@example.com"}
Subject: [Aura Alert] ${alert.type}

Alert Details:
--------------
Level: ${alert.level}
Type: ${alert.type}
Message: ${alert.message}
User ID: ${alert.userId}
Time: ${new Date().toISOString()}

Device Info:
${alert.deviceInfo ? JSON.stringify(alert.deviceInfo, null, 2) : "N/A"}

Metrics:
${alert.metrics ? JSON.stringify(alert.metrics, null, 2) : "N/A"}

---
This is an automated alert from Aura sync monitoring.
	`.trim();

	try {
		// 使用 Cloudflare Email Workers API
		// 需要在 wrangler.toml 配置 send_email binding
		if (env.EMAIL) {
			await env.EMAIL.send({
				from: `alerts@${env.EMAIL_DOMAIN || "aura.app"}`,
				to: env.ALERT_EMAIL || "zimm.yu@example.com",
				subject: `[Aura Alert] ${alert.type}`,
				content: emailContent,
			});
		} else {
			// Fallback: 使用 fetch 调用外部邮件服务 (如 Resend)
			if (env.RESEND_API_KEY) {
				await fetch("https://api.resend.com/emails", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${env.RESEND_API_KEY}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						from: `alerts@${env.EMAIL_DOMAIN || "aura.app"}`,
						to: env.ALERT_EMAIL || "zimm.yu@example.com",
						subject: `[Aura Alert] ${alert.type}`,
						text: emailContent,
					}),
				});
			}
		}
	} catch (error) {
		console.error("[alerts] Failed to send email:", error);
	}
}

/**
 * Log alert to Workers Analytics Engine
 * Provides time-series data for visualization
 */
export async function logToAnalytics(
	env: Env,
	alert: AlertPayload & { userId: string },
): Promise<void> {
	try {
		if (env.ANALYTICS) {
			await env.ANALYTICS.writeDataPoint({
				// Blobs: categorical data (max 20 per event)
				blobs: [alert.type, alert.level, alert.userId],
				// Doubles: numeric data (max 20 per event)
				doubles: [Date.now()],
				// Indexes: for filtering (max 1 per event)
				indexes: [alert.userId],
			});
		}
	} catch (error) {
		console.error("[alerts] Failed to log to analytics:", error);
	}
}

/**
 * Check if alert should trigger notification
 * Implements rate limiting to avoid spam
 */
export async function shouldNotify(
	env: Env,
	alertType: string,
	userId: string,
): Promise<boolean> {
	const key = `alert_throttle:${alertType}:${userId}`;

	try {
		const lastSent = await env.KV?.get(key);
		if (lastSent) {
			const timeSince = Date.now() - Number.parseInt(lastSent, 10);
			// 同一类型告警，1 小时内只发送一次
			if (timeSince < 3600000) {
				return false;
			}
		}

		// 记录本次发送时间
		await env.KV?.put(key, Date.now().toString(), {
			expirationTtl: 3600, // 1 hour
		});

		return true;
	} catch (error) {
		console.error("[alerts] Failed to check throttle:", error);
		return true; // 出错时允许发送
	}
}
