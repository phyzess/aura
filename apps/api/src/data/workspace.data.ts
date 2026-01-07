import type { Workspace } from "@aura/domain";
import { chunk } from "@aura/shared";
import { and, eq, gt, inArray, or } from "drizzle-orm";
import type { Db } from "@/db";
import { workspaces } from "@/db/app.schema";

const BATCH_SIZE = 10;

export const findByUserId =
	(db: Db) =>
	async (userId: string, since?: number): Promise<Workspace[]> => {
		const conditions = [eq(workspaces.userId, userId)];

		if (since) {
			conditions.push(
				or(gt(workspaces.updatedAt, since), gt(workspaces.deletedAt, since))!,
			);
		}

		return db
			.select()
			.from(workspaces)
			.where(and(...conditions));
	};

export const batchUpsert =
	(db: Db) =>
	async (items: Workspace[]): Promise<void> => {
		if (items.length === 0) return;

		const chunks = chunk(items, BATCH_SIZE);

		await Promise.all(
			chunks.map(async (chunkItems) => {
				for (const item of chunkItems) {
					await db
						.insert(workspaces)
						.values({
							id: item.id,
							userId: item.userId,
							name: item.name,
							description: item.description,
							order: item.order,
							createdAt: item.createdAt,
							updatedAt: item.updatedAt,
							deletedAt: item.deletedAt,
						})
						.onConflictDoUpdate({
							target: workspaces.id,
							set: {
								name: item.name,
								description: item.description,
								order: item.order,
								updatedAt: item.updatedAt,
								deletedAt: item.deletedAt,
							},
						});
				}
			}),
		);
	};

export const batchDelete =
	(db: Db) =>
	async (ids: string[]): Promise<void> => {
		if (ids.length === 0) return;

		const chunks = chunk(ids, 80);

		await Promise.all(
			chunks.map((chunkIds) =>
				db.delete(workspaces).where(inArray(workspaces.id, chunkIds)),
			),
		);
	};

export const createWorkspaceData = (db: Db) => ({
	findByUserId: findByUserId(db),
	batchUpsert: batchUpsert(db),
	batchDelete: batchDelete(db),
});
