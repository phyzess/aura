export const toMillis = (value: unknown): number => {
	if (value instanceof Date) {
		return value.getTime();
	}
	const d = new Date(value as unknown as Date);
	const t = d.getTime();
	return Number.isFinite(t) ? t : Date.now();
};

export const now = (): number => Date.now();

export const isValidTimestamp = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value) && value > 0;
