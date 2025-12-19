import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { users } from "./auth.schema";

export const workspaces = sqliteTable(
	"workspaces",
	{
		id: text("id").primaryKey(),
		userId: text("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		name: text("name").notNull(),
		description: text("description"),
		order: integer("order").notNull(),
		createdAt: integer("created_at", { mode: "number" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "number" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => Date.now())
			.notNull(),
		deletedAt: integer("deleted_at", { mode: "number" }),
	},
	(table) => [index("workspaces_userId_idx").on(table.userId)],
);

export const collections = sqliteTable(
	"collections",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		userId: text("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		name: text("name").notNull(),
		description: text("description"),
		order: integer("order").notNull(),
		createdAt: integer("created_at", { mode: "number" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "number" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => Date.now())
			.notNull(),
		deletedAt: integer("deleted_at", { mode: "number" }),
	},
	(table) => [
		index("collections_workspaceId_idx").on(table.workspaceId),
		index("collections_userId_idx").on(table.userId),
	],
);

export const tabs = sqliteTable(
	"tabs",
	{
		id: text("id").primaryKey(),
		collectionId: text("collection_id")
			.notNull()
			.references(() => collections.id, { onDelete: "cascade" }),
		userId: text("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		url: text("url").notNull(),
		title: text("title").notNull(),
		faviconUrl: text("favicon_url"),
		isPinned: integer("is_pinned", { mode: "boolean" })
			.default(false)
			.notNull(),
		order: integer("order").notNull(),
		createdAt: integer("created_at", { mode: "number" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "number" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => Date.now())
			.notNull(),
		deletedAt: integer("deleted_at", { mode: "number" }),
	},
	(table) => [
		index("tabs_collectionId_idx").on(table.collectionId),
		index("tabs_userId_idx").on(table.userId),
	],
);

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
	user: one(users, {
		fields: [workspaces.userId],
		references: [users.id],
	}),
	collections: many(collections),
}));

export const collectionsRelations = relations(collections, ({ many, one }) => ({
	workspace: one(workspaces, {
		fields: [collections.workspaceId],
		references: [workspaces.id],
	}),
	user: one(users, {
		fields: [collections.userId],
		references: [users.id],
	}),
	tabs: many(tabs),
}));

export const tabsRelations = relations(tabs, ({ one }) => ({
	collection: one(collections, {
		fields: [tabs.collectionId],
		references: [collections.id],
	}),
	user: one(users, {
		fields: [tabs.userId],
		references: [users.id],
	}),
}));
