import { chunk } from "../fp/array";
import type { Result } from "../fp/result";
import { tryCatchAsync } from "../fp/result";
import type {
	DataEntity,
	DataLayer,
	DataLayerConfig,
	LocalDataLayer,
} from "./types";

export interface ServerDataLayerDeps<T extends DataEntity> {
	findByUserIdQuery: (userId: string, since?: number) => Promise<T[]>;
	upsertOne: (item: T) => Promise<void>;
	findByIdQuery: (id: string) => Promise<T | null>;
	deleteByIdQuery: (id: string) => Promise<void>;
}

export const createServerDataLayer = <T extends DataEntity>(
	deps: ServerDataLayerDeps<T>,
	config: DataLayerConfig = {},
): DataLayer<T> => {
	const batchSize = config.batchSize ?? 10;

	return {
		findByUserId: async (userId: string, since?: number) =>
			tryCatchAsync(() => deps.findByUserIdQuery(userId, since)),

		batchUpsert: async (items: T[]) =>
			tryCatchAsync(async () => {
				if (items.length === 0) return;

				const chunks = chunk(items, batchSize);

				await Promise.all(
					chunks.map(async (chunkItems) => {
						for (const item of chunkItems) {
							await deps.upsertOne(item);
						}
					}),
				);
			}),

		findById: async (id: string) => tryCatchAsync(() => deps.findByIdQuery(id)),

		deleteById: async (id: string) =>
			tryCatchAsync(() => deps.deleteByIdQuery(id)),
	};
};

export interface LocalDataLayerDeps<T extends DataEntity> {
	getAllQuery: () => Promise<T[]>;
	saveAllQuery: (items: T[]) => Promise<void>;
	saveOneQuery: (item: T) => Promise<void>;
	removeQuery: (id: string) => Promise<void>;
	findByIdQuery: (id: string) => Promise<T | null>;
}

export const createLocalDataLayer = <T extends DataEntity>(
	deps: LocalDataLayerDeps<T>,
): LocalDataLayer<T> => ({
	getAll: () => deps.getAllQuery(),
	saveAll: (items: T[]) => deps.saveAllQuery(items),
	save: (item: T) => deps.saveOneQuery(item),
	remove: (id: string) => deps.removeQuery(id),
	findById: (id: string) => deps.findByIdQuery(id),
});

export const wrapLocalDataLayerWithResult = <T extends DataEntity>(
	layer: LocalDataLayer<T>,
): {
	getAll: () => Promise<Result<T[], Error>>;
	saveAll: (items: T[]) => Promise<Result<void, Error>>;
	save: (item: T) => Promise<Result<void, Error>>;
	remove: (id: string) => Promise<Result<void, Error>>;
	findById: (id: string) => Promise<Result<T | null, Error>>;
} => ({
	getAll: () => tryCatchAsync(() => layer.getAll()),
	saveAll: (items: T[]) => tryCatchAsync(() => layer.saveAll(items)),
	save: (item: T) => tryCatchAsync(() => layer.save(item)),
	remove: (id: string) => tryCatchAsync(() => layer.remove(id)),
	findById: (id: string) => tryCatchAsync(() => layer.findById(id)),
});
