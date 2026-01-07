import type { Collection } from "@aura/domain";
import { chunk } from "@aura/shared";
import { and, eq, gt, inArray, or } from "drizzle-orm";
import type { Db } from "@/db";
import { collections } from "@/db/app.schema";

const BATCH_SIZE = 10;

export const findByUserId =
	(db: Db) =>
	async (userId: string, since?: number): Promise<Collection[]> => {
		const conditions = [eq(collections.userId, userId)];

		if (since) {
			conditions.push(
				or(gt(collections.updatedAt, since), gt(collections.deletedAt, since))!,
			);
		}

		return db
			.select()
			.from(collections)
			.where(and(...conditions));
	};

export const batchUpsert =
	(db: Db) =>
	async (items: Collection[]): Promise<void> => {
		if (items.length === 0) return;

		const chunks = chunk(items, BATCH_SIZE);

		await Promise.all(
			chunks.map(async (chunkItems) => {
				for (const item of chunkItems) {
					await db
						.insert(collections)
						.values({
							id: item.id,
							workspaceId: item.workspaceId,
							userId: item.userId,
							name: item.name,
							description: item.description,
							order: item.order,
							createdAt: item.createdAt,
							updatedAt: item.updatedAt,
							deletedAt: item.deletedAt,
						})
						.onConflictDoUpdate({
							target: collections.id,
							set: {
								workspaceId: item.workspaceId,
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
				db.delete(collections).where(inArray(collections.id, chunkIds)),
			),
		);
	};

export const createCollectionData = (db: Db) => ({
	findByUserId: findByUserId(db),
	batchUpsert: batchUpsert(db),
	batchDelete: batchDelete(db),
});
