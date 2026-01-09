import type { Result } from "../fp/result";

export interface DataEntity {
	id: string;
	updatedAt: number;
	deletedAt?: number | null;
}

export interface DataLayerConfig {
	batchSize?: number;
}

export interface DataLayer<T extends DataEntity> {
	findByUserId(userId: string, since?: number): Promise<Result<T[], Error>>;
	batchUpsert(items: T[]): Promise<Result<void, Error>>;
	findById(id: string): Promise<Result<T | null, Error>>;
	deleteById(id: string): Promise<Result<void, Error>>;
}

export interface LocalDataLayer<T extends DataEntity> {
	getAll(): Promise<T[]>;
	saveAll(items: T[]): Promise<void>;
	save(item: T): Promise<void>;
	remove(id: string): Promise<void>;
	findById(id: string): Promise<T | null>;
}

export const DEFAULT_BATCH_SIZE = 10;
