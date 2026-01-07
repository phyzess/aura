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

