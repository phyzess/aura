import type { DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

export type TestDb = DrizzleD1Database<typeof schema>;

/**
 * Create a Drizzle instance for testing
 */
export function createTestDb(d1: D1Database): TestDb {
	return drizzle(d1, { schema });
}

/**
 * Clean up all tables (for test isolation)
 * Order matters due to foreign key constraints
 */
export async function cleanupTestDb(d1: D1Database): Promise<void> {
	try {
		// Delete in reverse dependency order using batch
		const statements = [
			d1.prepare("DELETE FROM tabs"),
			d1.prepare("DELETE FROM collections"),
			d1.prepare("DELETE FROM workspaces"),
			d1.prepare("DELETE FROM sessions"),
			d1.prepare("DELETE FROM accounts"),
			d1.prepare("DELETE FROM verifications"),
			d1.prepare("DELETE FROM users"),
		];

		await d1.batch(statements);
	} catch (error) {
		console.error("[test-db] Cleanup failed:", error);
		throw error;
	}
}

/**
 * Initialize test database with schema
 * This creates all tables if they don't exist
 * Uses batch operations for better performance
 */
export async function initTestDb(d1: D1Database): Promise<void> {
	try {
		const statements = [
			// Users table
			d1.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          email_verified INTEGER DEFAULT 0 NOT NULL,
          image TEXT,
          created_at INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
          updated_at INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
        )
      `),

			// Sessions table
			d1.prepare(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          expires_at INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          created_at INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
          updated_at INTEGER NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          timezone TEXT,
          city TEXT,
          country TEXT,
          region TEXT,
          region_code TEXT,
          colo TEXT,
          latitude TEXT,
          longitude TEXT
        )
      `),
			d1.prepare(
				"CREATE INDEX IF NOT EXISTS sessions_userId_idx ON sessions(user_id)",
			),

			// Accounts table
			d1.prepare(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          account_id TEXT NOT NULL,
          provider_id TEXT NOT NULL,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          access_token TEXT,
          refresh_token TEXT,
          id_token TEXT,
          access_token_expires_at INTEGER,
          refresh_token_expires_at INTEGER,
          scope TEXT,
          password TEXT,
          created_at INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
          updated_at INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
        )
      `),
			d1.prepare(
				"CREATE INDEX IF NOT EXISTS accounts_userId_idx ON accounts(user_id)",
			),

			// Verifications table
			d1.prepare(`
        CREATE TABLE IF NOT EXISTS verifications (
          id TEXT PRIMARY KEY,
          identifier TEXT NOT NULL,
          value TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at INTEGER,
          updated_at INTEGER
        )
      `),

			// Workspaces table
			d1.prepare(`
        CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          description TEXT,
          "order" INTEGER NOT NULL,
          created_at INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
          updated_at INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
          deleted_at INTEGER
        )
      `),
			d1.prepare(
				"CREATE INDEX IF NOT EXISTS workspaces_userId_idx ON workspaces(user_id)",
			),

			// Collections table
			d1.prepare(`
        CREATE TABLE IF NOT EXISTS collections (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          description TEXT,
          "order" INTEGER NOT NULL,
          created_at INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
          updated_at INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
          deleted_at INTEGER
        )
      `),
			d1.prepare(
				"CREATE INDEX IF NOT EXISTS collections_workspaceId_idx ON collections(workspace_id)",
			),
			d1.prepare(
				"CREATE INDEX IF NOT EXISTS collections_userId_idx ON collections(user_id)",
			),

			// Tabs table
			d1.prepare(`
        CREATE TABLE IF NOT EXISTS tabs (
          id TEXT PRIMARY KEY,
          collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
          user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
          url TEXT NOT NULL,
          title TEXT NOT NULL,
          favicon_url TEXT,
          is_pinned INTEGER DEFAULT 0 NOT NULL,
          "order" INTEGER NOT NULL,
          created_at INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
          updated_at INTEGER DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
          deleted_at INTEGER
        )
      `),
			d1.prepare(
				"CREATE INDEX IF NOT EXISTS tabs_collectionId_idx ON tabs(collection_id)",
			),
			d1.prepare("CREATE INDEX IF NOT EXISTS tabs_userId_idx ON tabs(user_id)"),
		];

		// Execute all statements in batch
		await d1.batch(statements);

		console.log("[test-db] Database initialized successfully");
	} catch (error) {
		console.error("[test-db] Initialization failed:", error);
		throw error;
	}
}
