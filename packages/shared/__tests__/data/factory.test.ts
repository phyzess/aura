import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createLocalDataLayer,
	createServerDataLayer,
	type LocalDataLayerDeps,
	type ServerDataLayerDeps,
	wrapLocalDataLayerWithResult,
} from "../../src/data/factory";
import { Err, Ok } from "../../src/fp/result";

describe("createServerDataLayer", () => {
	interface TestItem {
		id: string;
		updatedAt: number;
		userId: string;
		name: string;
	}

	const mockDeps: ServerDataLayerDeps<TestItem> = {
		findByUserIdQuery: vi.fn(),
		upsertOne: vi.fn(),
		findByIdQuery: vi.fn(),
		deleteByIdQuery: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should create a server data layer with all methods", () => {
		const layer = createServerDataLayer(mockDeps);

		expect(layer).toHaveProperty("findByUserId");
		expect(layer).toHaveProperty("batchUpsert");
		expect(layer).toHaveProperty("findById");
		expect(layer).toHaveProperty("deleteById");
	});

	it("should call findByUserIdQuery correctly", async () => {
		const mockItems: TestItem[] = [
			{ id: "1", updatedAt: Date.now(), userId: "user1", name: "Item 1" },
			{ id: "2", updatedAt: Date.now(), userId: "user1", name: "Item 2" },
		];
		vi.mocked(mockDeps.findByUserIdQuery).mockResolvedValue(mockItems);

		const layer = createServerDataLayer(mockDeps);
		const result = await layer.findByUserId("user1");

		expect(result).toEqual(Ok(mockItems));
		expect(mockDeps.findByUserIdQuery).toHaveBeenCalledWith("user1", undefined);
	});

	it("should handle errors in findByUserId", async () => {
		const error = new Error("Database error");
		vi.mocked(mockDeps.findByUserIdQuery).mockRejectedValue(error);

		const layer = createServerDataLayer(mockDeps);
		const result = await layer.findByUserId("user1");

		expect(result).toEqual(Err(error));
	});

	it("should batch upsert items with default batch size", async () => {
		const items: TestItem[] = Array.from({ length: 15 }, (_, i) => ({
			id: `${i}`,
			updatedAt: Date.now(),
			userId: "user1",
			name: `Item ${i}`,
		}));
		vi.mocked(mockDeps.upsertOne).mockResolvedValue(undefined);

		const layer = createServerDataLayer(mockDeps);
		const result = await layer.batchUpsert(items);

		expect(result).toEqual(Ok(undefined));
		// Default batch size is 10, so should be called 15 times
		expect(mockDeps.upsertOne).toHaveBeenCalledTimes(15);
	});

	it("should batch upsert items with custom batch size", async () => {
		const items: TestItem[] = Array.from({ length: 15 }, (_, i) => ({
			id: `${i}`,
			updatedAt: Date.now(),
			userId: "user1",
			name: `Item ${i}`,
		}));
		vi.mocked(mockDeps.upsertOne).mockResolvedValue(undefined);

		const layer = createServerDataLayer(mockDeps, { batchSize: 5 });
		const result = await layer.batchUpsert(items);

		expect(result).toEqual(Ok(undefined));
		expect(mockDeps.upsertOne).toHaveBeenCalledTimes(15);
	});

	it("should find item by id", async () => {
		const item: TestItem = {
			id: "1",
			updatedAt: Date.now(),
			userId: "user1",
			name: "Item 1",
		};
		vi.mocked(mockDeps.findByIdQuery).mockResolvedValue(item);

		const layer = createServerDataLayer(mockDeps);
		const result = await layer.findById("1");

		expect(result).toEqual(Ok(item));
		expect(mockDeps.findByIdQuery).toHaveBeenCalledWith("1");
	});

	it("should delete item by id", async () => {
		vi.mocked(mockDeps.deleteByIdQuery).mockResolvedValue(undefined);

		const layer = createServerDataLayer(mockDeps);
		const result = await layer.deleteById("1");

		expect(result).toEqual(Ok(undefined));
		expect(mockDeps.deleteByIdQuery).toHaveBeenCalledWith("1");
	});
});

describe("createLocalDataLayer", () => {
	interface TestItem {
		id: string;
		updatedAt: number;
		name: string;
	}

	const mockDeps: LocalDataLayerDeps<TestItem> = {
		getAllQuery: vi.fn(),
		saveAllQuery: vi.fn(),
		saveOneQuery: vi.fn(),
		removeQuery: vi.fn(),
		findByIdQuery: vi.fn(),
	};

	it("should create a local data layer with all methods", () => {
		const layer = createLocalDataLayer(mockDeps);

		expect(layer).toHaveProperty("getAll");
		expect(layer).toHaveProperty("saveAll");
		expect(layer).toHaveProperty("save");
		expect(layer).toHaveProperty("remove");
		expect(layer).toHaveProperty("findById");
	});

	it("should get all items", async () => {
		const items: TestItem[] = [
			{ id: "1", updatedAt: Date.now(), name: "Item 1" },
			{ id: "2", updatedAt: Date.now(), name: "Item 2" },
		];
		vi.mocked(mockDeps.getAllQuery).mockResolvedValue(items);

		const layer = createLocalDataLayer(mockDeps);
		const result = await layer.getAll();

		expect(result).toEqual(items);
		expect(mockDeps.getAllQuery).toHaveBeenCalled();
	});

	it("should save all items", async () => {
		const items: TestItem[] = [
			{ id: "1", updatedAt: Date.now(), name: "Item 1" },
			{ id: "2", updatedAt: Date.now(), name: "Item 2" },
		];
		vi.mocked(mockDeps.saveAllQuery).mockResolvedValue(undefined);

		const layer = createLocalDataLayer(mockDeps);
		await layer.saveAll(items);

		expect(mockDeps.saveAllQuery).toHaveBeenCalledWith(items);
	});

	it("should save one item", async () => {
		const item: TestItem = { id: "1", updatedAt: Date.now(), name: "Item 1" };
		vi.mocked(mockDeps.saveOneQuery).mockResolvedValue(undefined);

		const layer = createLocalDataLayer(mockDeps);
		await layer.save(item);

		expect(mockDeps.saveOneQuery).toHaveBeenCalledWith(item);
	});

	it("should remove item", async () => {
		vi.mocked(mockDeps.removeQuery).mockResolvedValue(undefined);

		const layer = createLocalDataLayer(mockDeps);
		await layer.remove("1");

		expect(mockDeps.removeQuery).toHaveBeenCalledWith("1");
	});

	it("should find item by id", async () => {
		const item: TestItem = { id: "1", updatedAt: Date.now(), name: "Item 1" };
		vi.mocked(mockDeps.findByIdQuery).mockResolvedValue(item);

		const layer = createLocalDataLayer(mockDeps);
		const result = await layer.findById("1");

		expect(result).toEqual(item);
		expect(mockDeps.findByIdQuery).toHaveBeenCalledWith("1");
	});
});

describe("wrapLocalDataLayerWithResult", () => {
	interface TestItem {
		id: string;
		updatedAt: number;
		name: string;
	}

	const mockDeps: LocalDataLayerDeps<TestItem> = {
		getAllQuery: vi.fn(),
		saveAllQuery: vi.fn(),
		saveOneQuery: vi.fn(),
		removeQuery: vi.fn(),
		findByIdQuery: vi.fn(),
	};

	it("should wrap getAll with Result", async () => {
		const items: TestItem[] = [
			{ id: "1", updatedAt: Date.now(), name: "Item 1" },
		];
		vi.mocked(mockDeps.getAllQuery).mockResolvedValue(items);

		const layer = createLocalDataLayer(mockDeps);
		const wrapped = wrapLocalDataLayerWithResult(layer);
		const result = await wrapped.getAll();

		expect(result).toEqual(Ok(items));
	});

	it("should handle errors in getAll", async () => {
		const error = new Error("Storage error");
		vi.mocked(mockDeps.getAllQuery).mockRejectedValue(error);

		const layer = createLocalDataLayer(mockDeps);
		const wrapped = wrapLocalDataLayerWithResult(layer);
		const result = await wrapped.getAll();

		expect(result).toEqual(Err(error));
	});

	it("should wrap saveAll with Result", async () => {
		const items: TestItem[] = [
			{ id: "1", updatedAt: Date.now(), name: "Item 1" },
		];
		vi.mocked(mockDeps.saveAllQuery).mockResolvedValue(undefined);

		const layer = createLocalDataLayer(mockDeps);
		const wrapped = wrapLocalDataLayerWithResult(layer);
		const result = await wrapped.saveAll(items);

		expect(result).toEqual(Ok(undefined));
	});

	it("should wrap save with Result", async () => {
		const item: TestItem = { id: "1", updatedAt: Date.now(), name: "Item 1" };
		vi.mocked(mockDeps.saveOneQuery).mockResolvedValue(undefined);

		const layer = createLocalDataLayer(mockDeps);
		const wrapped = wrapLocalDataLayerWithResult(layer);
		const result = await wrapped.save(item);

		expect(result).toEqual(Ok(undefined));
	});

	it("should wrap remove with Result", async () => {
		vi.mocked(mockDeps.removeQuery).mockResolvedValue(undefined);

		const layer = createLocalDataLayer(mockDeps);
		const wrapped = wrapLocalDataLayerWithResult(layer);
		const result = await wrapped.remove("1");

		expect(result).toEqual(Ok(undefined));
	});

	it("should wrap findById with Result", async () => {
		const item: TestItem = { id: "1", updatedAt: Date.now(), name: "Item 1" };
		vi.mocked(mockDeps.findByIdQuery).mockResolvedValue(item);

		const layer = createLocalDataLayer(mockDeps);
		const wrapped = wrapLocalDataLayerWithResult(layer);
		const result = await wrapped.findById("1");

		expect(result).toEqual(Ok(item));
	});
});
