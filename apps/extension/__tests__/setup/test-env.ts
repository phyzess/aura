import { vi } from "vitest";

// Mock crypto.randomUUID for tests
if (!globalThis.crypto) {
	globalThis.crypto = {} as Crypto;
}

if (!globalThis.crypto.randomUUID) {
	let counter = 0;
	globalThis.crypto.randomUUID = vi.fn(() => {
		counter++;
		return `test-uuid-${counter}`;
	});
}

// Mock IndexedDB for tests
if (!globalThis.indexedDB) {
	const createMockRequest = (result: any = null) => {
		const request: any = {
			onsuccess: null,
			onerror: null,
			result,
		};

		setTimeout(() => {
			if (request.onsuccess) {
				request.onsuccess({ target: { result } });
			}
		}, 0);

		return request;
	};

	const mockObjectStore = {
		getAll: vi.fn(() => createMockRequest([])),
		count: vi.fn(() => createMockRequest(0)),
		clear: vi.fn(() => createMockRequest(undefined)),
		add: vi.fn(() => createMockRequest(undefined)),
		put: vi.fn(() => createMockRequest(undefined)),
		delete: vi.fn(() => createMockRequest(undefined)),
		get: vi.fn(() => createMockRequest(undefined)),
		createIndex: vi.fn(() => ({})),
		openCursor: vi.fn(() => createMockRequest(null)),
	};

	const mockTransaction = {
		objectStore: vi.fn(() => mockObjectStore),
		oncomplete: null,
		onerror: null,
		onabort: null,
	};

	const mockDB = {
		transaction: vi.fn(() => mockTransaction),
		createObjectStore: vi.fn(() => mockObjectStore),
		deleteObjectStore: vi.fn(),
		close: vi.fn(),
		objectStoreNames: {
			contains: vi.fn(() => false),
		},
	};

	globalThis.indexedDB = {
		open: vi.fn((name: string, version: number) => {
			const request: any = {
				onsuccess: null,
				onerror: null,
				onupgradeneeded: null,
				result: mockDB,
			};

			setTimeout(() => {
				if (request.onupgradeneeded) {
					request.onupgradeneeded({
						target: { result: mockDB, transaction: mockTransaction },
					});
				}
				if (request.onsuccess) {
					request.onsuccess({ target: { result: mockDB } });
				}
			}, 0);

			return request;
		}),
		deleteDatabase: vi.fn(() => createMockRequest(undefined)),
		databases: vi.fn(() => Promise.resolve([])),
		cmp: vi.fn((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
	} as any;
}
