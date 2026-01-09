import { DATA_LAYER_CONSTANTS } from "@aura/config";
import type { Workspace } from "@aura/domain";
import { chunk, createServerDataLayer } from "@aura/shared";
import { and, eq, gt, inArray, or } from "drizzle-orm";
import type { Db } from "@/db";
import { workspaces } from "@/db/app.schema";

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

const upsertOne =
	(db: Db) =>
	async (item: Workspace): Promise<void> => {
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
	};

const findById =
	(db: Db) =>
	async (id: string): Promise<Workspace | null> => {
		const result = await db
			.select()
			.from(workspaces)
			.where(eq(workspaces.id, id))
			.limit(1);
		return result[0] ?? null;
	};

const deleteById =
	(db: Db) =>
	async (id: string): Promise<void> => {
		await db.delete(workspaces).where(eq(workspaces.id, id));
	};

export const batchUpsert =
	(db: Db) =>
	async (items: Workspace[]): Promise<void> => {
		if (items.length === 0) return;

		const chunks = chunk(items, DATA_LAYER_CONSTANTS.BATCH_SIZE.WORKSPACE);

		await Promise.all(
			chunks.map(async (chunkItems) => {
				for (const item of chunkItems) {
					await upsertOne(db)(item);
				}
			}),
		);
	};

export const batchDelete =
	(db: Db) =>
	async (ids: string[]): Promise<void> => {
		if (ids.length === 0) return;

		const chunks = chunk(ids, DATA_LAYER_CONSTANTS.BATCH_SIZE.DELETE);

		await Promise.all(
			chunks.map((chunkIds) =>
				db.delete(workspaces).where(inArray(workspaces.id, chunkIds)),
			),
		);
	};

export const createWorkspaceData = (db: Db) => {
	const dataLayer = createServerDataLayer<Workspace>(
		{
			findByUserIdQuery: findByUserId(db),
			upsertOne: upsertOne(db),
			findByIdQuery: findById(db),
			deleteByIdQuery: deleteById(db),
		},
		{ batchSize: DATA_LAYER_CONSTANTS.BATCH_SIZE.WORKSPACE },
	);

	return {
		...dataLayer,
		batchUpsert: batchUpsert(db),
		batchDelete: batchDelete(db),
	};
};
