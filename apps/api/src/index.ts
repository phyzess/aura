import { Hono } from "hono";
import authCallbackHtml from "./auth-callback.html";
import { PRIVACY_HTML } from "./privacy";
import { createAppRoutes } from "./routes/app.routes";
import { createAuthRoutes } from "./routes/auth.routes";
import type { Env } from "./types/env";

export type { Env };

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.html(authCallbackHtml));

app.get("/privacy", (c) => c.html(PRIVACY_HTML));

app.get("/api/health", (c) => c.text("ok"));

app.route("/api/app", createAppRoutes());

app.route("/api/auth", createAuthRoutes());

export default app;
