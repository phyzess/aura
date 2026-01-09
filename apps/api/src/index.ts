import { Hono } from "hono";
import authCallbackHtml from "./auth-callback.html";
import { initializeLogger } from "./logger";
import { loggerMiddleware } from "./logger/middleware";
import { PRIVACY_HTML } from "./privacy";
import { createAppRoutes } from "./routes/app.routes";
import { createAuthRoutes } from "./routes/auth.routes";
import type { Env } from "./types/env";

export type { Env };

// Initialize logger
initializeLogger(process.env.NODE_ENV).catch((error) => {
	console.error("[API] Failed to initialize logger:", error);
});

const app = new Hono<{ Bindings: Env }>();

// Add logger middleware
app.use("*", loggerMiddleware);

app.get("/", (c) => c.html(authCallbackHtml));

app.get("/privacy", (c) => c.html(PRIVACY_HTML));

app.get("/api/health", (c) => c.text("ok"));

app.route("/api/app", createAppRoutes());

app.route("/api/auth", createAuthRoutes());

export default app;
