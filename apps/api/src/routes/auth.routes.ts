import { ERROR_MESSAGES, HTTP_STATUS } from "@aura/config";
import { Hono } from "hono";
import { createAuth } from "@/auth";
import {
	generateVerificationCode,
	generateVerificationEmailHTML,
	sendEmail,
} from "@/auth/email";
import { verifyTurnstile } from "@/auth/turnstile";
import type { Env } from "@/types/env";

export const createAuthRoutes = () => {
	const app = new Hono<{ Bindings: Env }>();

	app.post("/verify-turnstile", async (c) => {
		const body = (await c.req.json().catch(() => null)) as {
			token?: string;
		} | null;

		if (!body || typeof body.token !== "string") {
			return c.json(
				{ error: ERROR_MESSAGES.MISSING_REQUIRED_FIELD },
				HTTP_STATUS.BAD_REQUEST,
			);
		}

		const secretKey = c.env.TURNSTILE_SECRET_KEY;
		if (!secretKey) {
			return c.json({ success: true });
		}

		const remoteIp = c.req.header("CF-Connecting-IP");
		const result = await verifyTurnstile(body.token, secretKey, remoteIp);

		if (!result.success) {
			return c.json(
				{ error: result.error || "Verification failed" },
				HTTP_STATUS.BAD_REQUEST,
			);
		}

		return c.json({ success: true });
	});

	app.post("/email/send-code", async (c) => {
		const body = (await c.req.json().catch(() => null)) as {
			email?: string;
		} | null;

		if (!body || typeof body.email !== "string" || !body.email.includes("@")) {
			return c.json(
				{ error: ERROR_MESSAGES.INVALID_INPUT },
				HTTP_STATUS.BAD_REQUEST,
			);
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
			return c.json(
				{ error: emailResult.error || "Failed to send email" },
				HTTP_STATUS.INTERNAL_SERVER_ERROR,
			);
		}

		return c.json({ success: true });
	});

	app.post("/email/verify-code", async (c) => {
		const body = (await c.req.json().catch(() => null)) as {
			email?: string;
			code?: string;
		} | null;

		if (
			!body ||
			typeof body.email !== "string" ||
			typeof body.code !== "string"
		) {
			return c.json(
				{ error: ERROR_MESSAGES.INVALID_INPUT },
				HTTP_STATUS.BAD_REQUEST,
			);
		}

		const email = body.email.toLowerCase().trim();
		const storedCode = await c.env.AUTH_KV.get(`email-verify:${email}`);

		if (!storedCode || storedCode !== body.code) {
			return c.json(
				{ error: "Invalid or expired verification code" },
				HTTP_STATUS.BAD_REQUEST,
			);
		}

		await c.env.AUTH_KV.delete(`email-verify:${email}`);

		return c.json({ success: true, email });
	});

	app.on("GET", "/*", (c) => {
		const auth = createAuth(c.env, c.req.raw.cf);
		return auth.handler(c.req.raw);
	});

	app.on("POST", "/*", (c) => {
		const auth = createAuth(c.env, c.req.raw.cf);
		return auth.handler(c.req.raw);
	});

	return app;
};
