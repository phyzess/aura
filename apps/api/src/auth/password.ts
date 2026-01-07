function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function hexToBytes(hex: string): Uint8Array {
	if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
	const out = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		out[i / 2] = parseInt(hex.slice(i, i + 2), 16);
	}
	return out;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a[i] ^ b[i];
	}
	return diff === 0;
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
	const buf = await crypto.subtle.digest("SHA-256", data as BufferSource);
	return new Uint8Array(buf);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const saltHex = bytesToHex(salt);
	const encoder = new TextEncoder();
	const pwdBytes = encoder.encode(password.normalize("NFKC"));
	const combined = new Uint8Array(salt.length + pwdBytes.length);
	combined.set(salt, 0);
	combined.set(pwdBytes, salt.length);
	const digest = await sha256(combined);
	return `${saltHex}:${bytesToHex(digest)}`;
}

export async function verifyPassword(params: {
	password: string;
	hash: string;
}): Promise<boolean> {
	const { password, hash } = params;
	const [saltHex, hashHex] = hash.split(":");
	if (!saltHex || !hashHex) return false;
	const salt = hexToBytes(saltHex);
	const expected = hexToBytes(hashHex);
	const encoder = new TextEncoder();
	const pwdBytes = encoder.encode(password.normalize("NFKC"));
	const combined = new Uint8Array(salt.length + pwdBytes.length);
	combined.set(salt, 0);
	combined.set(pwdBytes, salt.length);
	const actual = await sha256(combined);
	return constantTimeEqual(actual, expected);
}
