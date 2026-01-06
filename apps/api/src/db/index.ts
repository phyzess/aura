import { drizzle } from "drizzle-orm/d1";

import { schema } from "./schema";

export function createDb(db: D1Database) {
	return drizzle(db, { schema });
}

export type Db = ReturnType<typeof createDb>;

export { schema };
