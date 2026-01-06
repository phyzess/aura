import type {
	D1Database,
	IncomingRequestCfProperties,
	KVNamespace,
} from "@cloudflare/workers-types";
import { and, eq, gt, or } from "drizzle-orm";
import { Hono } from "hono";
import type {
	User as DomainUser,
	SyncPayload,
} from "../../packages/domain/src";

import { logToAnalytics, sendEmailAlert, shouldNotify } from "./alerts";
import { createAuth } from "./auth";
import {
	generateVerificationCode,
	generateVerificationEmailHTML,
	sendEmail,
} from "./auth/email";
import { verifyTurnstile } from "./auth/turnstile";
import authCallbackHtml from "./auth-callback.html";
import { createDb } from "./db";
import { alerts, syncMetrics } from "./db/alerts.schema";
import { collections, tabs, workspaces } from "./db/app.schema";
import { PRIVACY_HTML } from "./privacy";

export interface Env {
	DB: D1Database;
	AUTH_KV: KVNamespace;
	KV?: KVNamespace; // For alert throttling
	ANALYTICS?: AnalyticsEngineDataset;
	EMAIL?: {
		send: (message: {
			from: string;
			to: string;
			subject: string;
			content: string;
		}) => Promise<void>;
	};
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	BETTER_AUTH_TRUSTED_ORIGINS: string;
	TURNSTILE_SECRET_KEY?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	GITHUB_CLIENT_ID?: string;
	GITHUB_CLIENT_SECRET?: string;
	// Alert configuration
	ALERT_EMAIL?: string; // Your email for alerts
	EMAIL_DOMAIN?: string; // Domain for sending emails
	RESEND_API_KEY?: string; // Fallback email service
}

const app = new Hono<{ Bindings: Env }>();

const toMillis = (value: unknown): number => {
	if (value instanceof Date) {
		return value.getTime();
	}
	const d = new Date(value as unknown as Date);
	const t = d.getTime();
	return Number.isFinite(t) ? t : Date.now();
};

// Removed batch size constants - no longer needed with LWW upsert strategy

app.get("/", (c) => c.html(authCallbackHtml));

app.get("/privacy", (c) => c.html(PRIVACY_HTML));

app.get("/api/health", (c) => c.text("ok"));

app.get("/api/app/me", async (c) => {
	const auth = createAuth(
		c.env,
		c.req.raw.cf as IncomingRequestCfProperties | undefined,
	);

	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session?.user) {
		return c.json({ user: null });
	}

	const user: DomainUser = {
		id: session.user.id,
		email: session.user.email,
		name: session.user.name ?? session.user.email,
		createdAt: toMillis(session.user.createdAt),
		updatedAt: toMillis(session.user.updatedAt),
	};

	return c.json<{ user: DomainUser | null }>({ user });
});

app.post("/api/app/sync/pull", async (c) => {
	const auth = createAuth(
		c.env,
		c.req.raw.cf as IncomingRequestCfProperties | undefined,
	);

	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session?.user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = (await c.req.json().catch(() => null)) as {
		lastSyncTimestamp?: unknown;
	} | null;

	const lastSyncRaw =
		body && typeof body === "object" ? body.lastSyncTimestamp : undefined;
	const lastSyncTimestamp =
		typeof lastSyncRaw === "number" && Number.isFinite(lastSyncRaw)
			? lastSyncRaw
			: 0;

	const userId = session.user.id;
	const db = createDb(c.env.DB);

	const [workspaceRows, collectionRows, tabRows] = await Promise.all([
		db
			.select()
			.from(workspaces)
			.where(
				and(
					eq(workspaces.userId, userId),
					or(
						gt(workspaces.updatedAt, lastSyncTimestamp),
						gt(workspaces.deletedAt, lastSyncTimestamp),
					),
				),
			),
		db
			.select()
			.from(collections)
			.where(
				and(
					eq(collections.userId, userId),
					or(
						gt(collections.updatedAt, lastSyncTimestamp),
						gt(collections.deletedAt, lastSyncTimestamp),
					),
				),
			),
		db
			.select()
			.from(tabs)
			.where(
				and(
					eq(tabs.userId, userId),
					or(
						gt(tabs.updatedAt, lastSyncTimestamp),
						gt(tabs.deletedAt, lastSyncTimestamp),
					),
				),
			),
	]);

	let nextLastSync = lastSyncTimestamp;
	for (const w of workspaceRows) {
		if (w.updatedAt > nextLastSync) nextLastSync = w.updatedAt;
		if (w.deletedAt && w.deletedAt > nextLastSync) nextLastSync = w.deletedAt;
	}
	for (const col of collectionRows) {
		if (col.updatedAt > nextLastSync) nextLastSync = col.updatedAt;
		if (col.deletedAt && col.deletedAt > nextLastSync)
			nextLastSync = col.deletedAt;
	}
	for (const t of tabRows) {
		if (t.updatedAt > nextLastSync) nextLastSync = t.updatedAt;
		if (t.deletedAt && t.deletedAt > nextLastSync) nextLastSync = t.deletedAt;
	}

	const response: SyncPayload = {
		workspaces: workspaceRows.map((w) => ({
			id: w.id,
			userId: w.userId ?? undefined,
			name: w.name,
			description: w.description ?? undefined,
			order: w.order,
			createdAt: w.createdAt,
			updatedAt: w.updatedAt,
			deletedAt: w.deletedAt ?? undefined,
		})),
		collections: collectionRows.map((col) => ({
			id: col.id,
			workspaceId: col.workspaceId,
			userId: col.userId ?? undefined,
			name: col.name,
			description: col.description ?? undefined,
			order: col.order,
			createdAt: col.createdAt,
			updatedAt: col.updatedAt,
			deletedAt: col.deletedAt ?? undefined,
		})),
		tabs: tabRows.map((t) => ({
			id: t.id,
			collectionId: t.collectionId,
			userId: t.userId ?? undefined,
			url: t.url,
			title: t.title,
			faviconUrl: t.faviconUrl ?? undefined,
			isPinned: t.isPinned ?? undefined,
			order: t.order,
			createdAt: t.createdAt,
			updatedAt: t.updatedAt,
			deletedAt: t.deletedAt ?? undefined,
		})),
		lastSyncTimestamp: nextLastSync,
	};

	return c.json<SyncPayload>(response);
});

app.post("/api/app/sync/push", async (c) => {
	try {
		const startTime = Date.now();

		const auth = createAuth(
			c.env,
			c.req.raw.cf as IncomingRequestCfProperties | undefined,
		);

		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session?.user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const payload = (await c.req.json().catch(() => null)) as {
			workspaces?: unknown;
			collections?: unknown;
			tabs?: unknown;
			lastSyncTimestamp?: unknown;
		} | null;

		if (!payload || typeof payload !== "object") {
			return c.json({ error: "Invalid payload" }, 400);
		}

		const isNumber = (value: unknown): value is number =>
			typeof value === "number" && Number.isFinite(value);

		const lastSyncRaw = payload.lastSyncTimestamp;
		const lastSyncTimestamp =
			typeof lastSyncRaw === "number" && Number.isFinite(lastSyncRaw)
				? lastSyncRaw
				: undefined;

		const workspacesInput = Array.isArray(payload.workspaces)
			? payload.workspaces.filter(
					(
						w,
					): w is {
						id: string;
						name: string;
						description?: string | null;
						order: number;
						createdAt: number;
						updatedAt: number;
						deletedAt?: number | null;
					} =>
						w &&
						typeof w.id === "string" &&
						typeof w.name === "string" &&
						isNumber(w.order) &&
						isNumber(w.createdAt) &&
						isNumber(w.updatedAt) &&
						(w.deletedAt === undefined ||
							w.deletedAt === null ||
							isNumber(w.deletedAt)),
				)
			: [];

		const collectionsInput = Array.isArray(payload.collections)
			? payload.collections.filter(
					(
						col,
					): col is {
						id: string;
						workspaceId: string;
						name: string;
						description?: string | null;
						order: number;
						createdAt: number;
						updatedAt: number;
						deletedAt?: number | null;
					} =>
						col &&
						typeof col.id === "string" &&
						typeof col.workspaceId === "string" &&
						typeof col.name === "string" &&
						isNumber(col.order) &&
						isNumber(col.createdAt) &&
						isNumber(col.updatedAt) &&
						(col.deletedAt === undefined ||
							col.deletedAt === null ||
							isNumber(col.deletedAt)),
				)
			: [];

		const tabsInput = Array.isArray(payload.tabs)
			? payload.tabs.filter(
					(
						t,
					): t is {
						id: string;
						collectionId: string;
						url: string;
						title: string;
						faviconUrl?: string | null;
						isPinned?: boolean;
						order: number;
						createdAt: number;
						updatedAt: number;
						deletedAt?: number | null;
					} =>
						t &&
						typeof t.id === "string" &&
						typeof t.collectionId === "string" &&
						typeof t.url === "string" &&
						typeof t.title === "string" &&
						isNumber(t.order) &&
						isNumber(t.createdAt) &&
						isNumber(t.updatedAt) &&
						(t.deletedAt === undefined ||
							t.deletedAt === null ||
							isNumber(t.deletedAt)),
				)
			: [];

		const hasWorkspaceItems =
			Array.isArray(payload.workspaces) && payload.workspaces.length > 0;
		const hasCollectionItems =
			Array.isArray(payload.collections) && payload.collections.length > 0;
		const hasTabItems = Array.isArray(payload.tabs) && payload.tabs.length > 0;

		if (
			(hasWorkspaceItems && workspacesInput.length === 0) ||
			(hasCollectionItems && collectionsInput.length === 0) ||
			(hasTabItems && tabsInput.length === 0)
		) {
			return c.json({ error: "Invalid payload items" }, 400);
		}

		const workspaceIds = new Set(workspacesInput.map((w) => w.id));
		const collectionIds = new Set(collectionsInput.map((col) => col.id));

		for (const col of collectionsInput) {
			if (!workspaceIds.has(col.workspaceId)) {
				return c.json({ error: "Invalid collection.workspaceId" }, 400);
			}
		}

		for (const t of tabsInput) {
			if (!collectionIds.has(t.collectionId)) {
				return c.json({ error: "Invalid tab.collectionId" }, 400);
			}
		}

		const userId = session.user.id;
		const db = createDb(c.env.DB);

		console.log("[sync/push] request summary", {
			userId,
			workspacesCount: workspacesInput.length,
			collectionsCount: collectionsInput.length,
			tabsCount: tabsInput.length,
			lastSyncTimestamp,
		});

		if (
			workspacesInput.length >= 50 ||
			collectionsInput.length >= 200 ||
			tabsInput.length >= 1000
		) {
			console.log("[sync/push] large payload", {
				workspacesCount: workspacesInput.length,
				collectionsCount: collectionsInput.length,
				tabsCount: tabsInput.length,
			});
		}

		if (
			workspacesInput.length === 0 &&
			collectionsInput.length === 0 &&
			tabsInput.length === 0
		) {
			return c.json({ ok: true });
		}

		// Use Last-Write-Wins (LWW) strategy with upsert
		// Only update server data if client data is newer

		let workspacesUpdated = 0;
		let workspacesSkipped = 0;
		let collectionsUpdated = 0;
		let collectionsSkipped = 0;
		let tabsUpdated = 0;
		let tabsSkipped = 0;

		// Process workspaces with LWW
		if (workspacesInput.length > 0) {
			for (const w of workspacesInput) {
				// Check if workspace exists and compare timestamps
				const existing = await db
					.select()
					.from(workspaces)
					.where(and(eq(workspaces.id, w.id), eq(workspaces.userId, userId)))
					.get();

				const clientTime = w.deletedAt ?? w.updatedAt;
				const serverTime = existing
					? (existing.deletedAt ?? existing.updatedAt)
					: 0;

				if (!existing || clientTime > serverTime) {
					// Client data is newer or doesn't exist on server, upsert it
					await db
						.insert(workspaces)
						.values({
							id: w.id,
							userId,
							name: w.name,
							description: w.description ?? null,
							order: w.order,
							createdAt: w.createdAt,
							updatedAt: w.updatedAt,
							deletedAt: w.deletedAt ?? null,
						})
						.onConflictDoUpdate({
							target: workspaces.id,
							set: {
								name: w.name,
								description: w.description ?? null,
								order: w.order,
								updatedAt: w.updatedAt,
								deletedAt: w.deletedAt ?? null,
							},
						});
					workspacesUpdated++;
				} else {
					// Server data is newer, skip update
					workspacesSkipped++;
				}
			}
		}

		// Process collections with LWW
		if (collectionsInput.length > 0) {
			for (const col of collectionsInput) {
				const existing = await db
					.select()
					.from(collections)
					.where(
						and(eq(collections.id, col.id), eq(collections.userId, userId)),
					)
					.get();

				const clientTime = col.deletedAt ?? col.updatedAt;
				const serverTime = existing
					? (existing.deletedAt ?? existing.updatedAt)
					: 0;

				if (!existing || clientTime > serverTime) {
					await db
						.insert(collections)
						.values({
							id: col.id,
							workspaceId: col.workspaceId,
							userId,
							name: col.name,
							description: col.description ?? null,
							order: col.order,
							createdAt: col.createdAt,
							updatedAt: col.updatedAt,
							deletedAt: col.deletedAt ?? null,
						})
						.onConflictDoUpdate({
							target: collections.id,
							set: {
								workspaceId: col.workspaceId,
								name: col.name,
								description: col.description ?? null,
								order: col.order,
								updatedAt: col.updatedAt,
								deletedAt: col.deletedAt ?? null,
							},
						});
					collectionsUpdated++;
				} else {
					collectionsSkipped++;
				}
			}
		}

		// Process tabs with LWW
		if (tabsInput.length > 0) {
			for (const t of tabsInput) {
				const existing = await db
					.select()
					.from(tabs)
					.where(and(eq(tabs.id, t.id), eq(tabs.userId, userId)))
					.get();

				const clientTime = t.deletedAt ?? t.updatedAt;
				const serverTime = existing
					? (existing.deletedAt ?? existing.updatedAt)
					: 0;

				if (!existing || clientTime > serverTime) {
					await db
						.insert(tabs)
						.values({
							id: t.id,
							collectionId: t.collectionId,
							userId,
							url: t.url,
							title: t.title,
							faviconUrl: t.faviconUrl ?? null,
							isPinned: t.isPinned ?? false,
							order: t.order,
							createdAt: t.createdAt,
							updatedAt: t.updatedAt,
							deletedAt: t.deletedAt ?? null,
						})
						.onConflictDoUpdate({
							target: tabs.id,
							set: {
								collectionId: t.collectionId,
								url: t.url,
								title: t.title,
								faviconUrl: t.faviconUrl ?? null,
								isPinned: t.isPinned ?? false,
								order: t.order,
								updatedAt: t.updatedAt,
								deletedAt: t.deletedAt ?? null,
							},
						});
					tabsUpdated++;
				} else {
					tabsSkipped++;
				}
			}
		}

		const endTime = Date.now();
		const duration = endTime - (startTime || endTime);

		console.log("[sync/push] LWW results", {
			workspaces: { updated: workspacesUpdated, skipped: workspacesSkipped },
			collections: {
				updated: collectionsUpdated,
				skipped: collectionsSkipped,
			},
			tabs: { updated: tabsUpdated, skipped: tabsSkipped },
			duration: `${duration}ms`,
		});

		// Save metrics to D1
		await db.insert(syncMetrics).values({
			id: crypto.randomUUID(),
			userId,
			workspacesInput: workspacesInput.length,
			collectionsInput: collectionsInput.length,
			tabsInput: tabsInput.length,
			workspacesUpdated,
			workspacesSkipped,
			collectionsUpdated,
			collectionsSkipped,
			tabsUpdated,
			tabsSkipped,
			duration,
			dbOperations:
				workspacesInput.length + collectionsInput.length + tabsInput.length,
		});

		return c.json({ ok: true });
	} catch (error) {
		console.error("[sync/push] unexpected error", {
			name: (error as Error).name,
			message: (error as Error).message,
			stack: (error as Error).stack,
		});
		throw error;
	}
});

app.post("/api/auth/verify-turnstile", async (c) => {
	const body = (await c.req.json().catch(() => null)) as {
		token?: string;
	} | null;

	if (!body || typeof body.token !== "string") {
		return c.json({ error: "Missing turnstile token" }, 400);
	}

	const secretKey = c.env.TURNSTILE_SECRET_KEY;
	if (!secretKey) {
		return c.json({ success: true });
	}

	const remoteIp = c.req.header("CF-Connecting-IP");
	const result = await verifyTurnstile(body.token, secretKey, remoteIp);

	if (!result.success) {
		return c.json({ error: result.error || "Verification failed" }, 400);
	}

	return c.json({ success: true });
});

app.post("/api/auth/email/send-code", async (c) => {
	const body = (await c.req.json().catch(() => null)) as {
		email?: string;
	} | null;

	if (!body || typeof body.email !== "string" || !body.email.includes("@")) {
		return c.json({ error: "Invalid email address" }, 400);
	}

	const email = body.email.toLowerCase().trim();
	const code = generateVerificationCode();

	await c.env.AUTH_KV.put(`email-verify:${email}`, code, {
		expirationTtl: 600,
	});

	const emailResult = await sendEmail({
		to: email,
		subject: "Verify your email - Aura",
		html: generateVerificationEmailHTML(code),
	});

	if (!emailResult.success) {
		return c.json({ error: emailResult.error || "Failed to send email" }, 500);
	}

	return c.json({ success: true });
});

app.post("/api/auth/email/verify-code", async (c) => {
	const body = (await c.req.json().catch(() => null)) as {
		email?: string;
		code?: string;
	} | null;

	if (
		!body ||
		typeof body.email !== "string" ||
		typeof body.code !== "string"
	) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const email = body.email.toLowerCase().trim();
	const storedCode = await c.env.AUTH_KV.get(`email-verify:${email}`);

	if (!storedCode || storedCode !== body.code) {
		return c.json({ error: "Invalid or expired verification code" }, 400);
	}

	await c.env.AUTH_KV.delete(`email-verify:${email}`);

	return c.json({ success: true, email });
});

// Alert API
app.post("/api/app/alerts", async (c) => {
	try {
		const auth = createAuth(
			c.env,
			c.req.raw.cf as IncomingRequestCfProperties | undefined,
		);

		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session?.user) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const body = (await c.req.json().catch(() => null)) as {
			alerts?: Array<{
				level: "info" | "warning" | "error";
				type: string;
				message: string;
				deviceInfo?: {
					browser: string;
					os: string;
					version: string;
				};
				metrics?: Record<string, unknown>;
			}>;
		} | null;

		if (!body || !Array.isArray(body.alerts)) {
			return c.json({ error: "Invalid payload" }, 400);
		}

		const userId = session.user.id;
		const db = createDb(c.env.DB);

		for (const alert of body.alerts) {
			// Save to D1
			await db.insert(alerts).values({
				id: crypto.randomUUID(),
				userId,
				level: alert.level,
				type: alert.type,
				message: alert.message,
				deviceInfo: alert.deviceInfo ? JSON.stringify(alert.deviceInfo) : null,
				metrics: alert.metrics ? JSON.stringify(alert.metrics) : null,
			});

			// Log to Analytics Engine
			await logToAnalytics(c.env, { ...alert, userId });

			// Send email for critical alerts (with rate limiting)
			if (
				alert.level === "error" &&
				(await shouldNotify(c.env, alert.type, userId))
			) {
				await sendEmailAlert(c.env, { ...alert, userId });
			}

			console.log("[alerts] Recorded alert:", {
				userId,
				level: alert.level,
				type: alert.type,
			});
		}

		return c.json({ ok: true });
	} catch (error) {
		console.error("[alerts] Error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// Admin API - View recent alerts
app.get("/api/admin/alerts", async (c) => {
	const adminToken = c.req.header("X-Admin-Token");
	if (!adminToken || adminToken !== c.env.BETTER_AUTH_SECRET) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = createDb(c.env.DB);
	const limit = Number.parseInt(c.req.query("limit") || "100", 10);
	const level = c.req.query("level") as
		| "info"
		| "warning"
		| "error"
		| undefined;

	const recentAlerts = await db
		.select()
		.from(alerts)
		.where(level ? eq(alerts.level, level) : undefined)
		.orderBy(alerts.createdAt)
		.limit(limit);

	return c.json({ alerts: recentAlerts });
});

// Admin API - View sync metrics
app.get("/api/admin/metrics", async (c) => {
	const adminToken = c.req.header("X-Admin-Token");
	if (!adminToken || adminToken !== c.env.BETTER_AUTH_SECRET) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = createDb(c.env.DB);
	const limit = Number.parseInt(c.req.query("limit") || "100", 10);

	const recentMetrics = await db
		.select()
		.from(syncMetrics)
		.orderBy(syncMetrics.createdAt)
		.limit(limit);

	return c.json({ metrics: recentMetrics });
});

app.on("GET", "/api/auth/*", (c) => {
	const auth = createAuth(
		c.env,
		c.req.raw.cf as IncomingRequestCfProperties | undefined,
	);
	return auth.handler(c.req.raw);
});

app.on("POST", "/api/auth/*", (c) => {
	const auth = createAuth(
		c.env,
		c.req.raw.cf as IncomingRequestCfProperties | undefined,
	);
	return auth.handler(c.req.raw);
});

export default app;
