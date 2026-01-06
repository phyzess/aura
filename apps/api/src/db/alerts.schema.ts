import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { users } from "./auth.schema";

export const alerts = sqliteTable(
	"alerts",
	{
		id: text("id").primaryKey(),
		userId: text("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		level: text("level", { enum: ["info", "warning", "error"] }).notNull(),
		type: text("type").notNull(),
		message: text("message").notNull(),
		deviceInfo: text("device_info"), // JSON string
		metrics: text("metrics"), // JSON string
		createdAt: integer("created_at", { mode: "number" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("alerts_userId_idx").on(table.userId),
		index("alerts_level_idx").on(table.level),
		index("alerts_type_idx").on(table.type),
		index("alerts_createdAt_idx").on(table.createdAt),
	],
);

export const syncMetrics = sqliteTable(
	"sync_metrics",
	{
		id: text("id").primaryKey(),
		userId: text("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		// Input counts
		workspacesInput: integer("workspaces_input").notNull(),
		collectionsInput: integer("collections_input").notNull(),
		tabsInput: integer("tabs_input").notNull(),
		// Result counts
		workspacesUpdated: integer("workspaces_updated").notNull(),
		workspacesSkipped: integer("workspaces_skipped").notNull(),
		collectionsUpdated: integer("collections_updated").notNull(),
		collectionsSkipped: integer("collections_skipped").notNull(),
		tabsUpdated: integer("tabs_updated").notNull(),
		tabsSkipped: integer("tabs_skipped").notNull(),
		// Performance
		duration: integer("duration").notNull(), // milliseconds
		dbOperations: integer("db_operations").notNull(),
		createdAt: integer("created_at", { mode: "number" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("sync_metrics_userId_idx").on(table.userId),
		index("sync_metrics_createdAt_idx").on(table.createdAt),
	],
);
