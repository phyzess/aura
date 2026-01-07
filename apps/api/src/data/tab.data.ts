import type { TabItem } from "@aura/domain";
import { chunk } from "@aura/shared";
import { and, eq, gt, inArray, or } from "drizzle-orm";
import type { Db } from "@/db";
import { tabs } from "@/db/app.schema";

const BATCH_SIZE = 8;

export const findByUserId =
	(db: Db) =>
	async (userId: string, since?: number): Promise<TabItem[]> => {
		const conditions = [eq(tabs.userId, userId)];

		if (since) {
			conditions.push(
				or(gt(tabs.updatedAt, since), gt(tabs.deletedAt, since))!,
			);
		}

		return db
			.select()
			.from(tabs)
			.where(and(...conditions));
	};

export const batchUpsert =
	(db: Db) =>
	async (items: TabItem[]): Promise<void> => {
		if (items.length === 0) return;

		const chunks = chunk(items, BATCH_SIZE);

		await Promise.all(
			chunks.map(async (chunkItems) => {
				for (const item of chunkItems) {
					await db
						.insert(tabs)
						.values({
							id: item.id,
							collectionId: item.collectionId,
							userId: item.userId,
							url: item.url,
							title: item.title,
							faviconUrl: item.faviconUrl,
							isPinned: item.isPinned ?? false,
							order: item.order,
							createdAt: item.createdAt,
							updatedAt: item.updatedAt,
							deletedAt: item.deletedAt,
						})
						.onConflictDoUpdate({
							target: tabs.id,
							set: {
								collectionId: item.collectionId,
								url: item.url,
								title: item.title,
								faviconUrl: item.faviconUrl,
								isPinned: item.isPinned ?? false,
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
				db.delete(tabs).where(inArray(tabs.id, chunkIds)),
			),
		);
	};

export const createTabData = (db: Db) => ({
	findByUserId: findByUserId(db),
	batchUpsert: batchUpsert(db),
	batchDelete: batchDelete(db),
});
