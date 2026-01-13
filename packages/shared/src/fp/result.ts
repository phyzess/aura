export type Result<T, E = Error> =
	| { ok: true; value: T }
	| { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const isOk = <T, E>(
	result: Result<T, E>,
): result is { ok: true; value: T } => result.ok === true;

export const isErr = <T, E>(
	result: Result<T, E>,
): result is { ok: false; error: E } => result.ok === false;

export const map =
	<T, U, E>(fn: (value: T) => U) =>
	(result: Result<T, E>): Result<U, E> => {
		return result.ok ? ok(fn(result.value)) : result;
	};

export const mapErr =
	<T, E, F>(fn: (error: E) => F) =>
	(result: Result<T, E>): Result<T, F> => {
		return result.ok ? result : err(fn(result.error));
	};

export const flatMap =
	<T, U, E>(fn: (value: T) => Result<U, E>) =>
	(result: Result<T, E>): Result<U, E> => {
		return result.ok ? fn(result.value) : result;
	};

export const unwrap = <T, E>(result: Result<T, E>): T => {
	if (result.ok) {
		return result.value;
	}
	throw result.error;
};

export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
	if (result.ok) {
		return result.value;
	}
	return defaultValue;
};

export const getOrElse =
	<T, E>(defaultValue: T) =>
	(result: Result<T, E>): T => {
		return result.ok ? result.value : defaultValue;
	};

export const match =
	<T, E, U>(onOk: (value: T) => U, onErr: (error: E) => U) =>
	(result: Result<T, E>): U => {
		return result.ok ? onOk(result.value) : onErr(result.error);
	};

export const tryCatch = <T, E = Error>(
	fn: () => T,
	onError?: (error: unknown) => E,
): Result<T, E> => {
	try {
		return ok(fn());
	} catch (error) {
		return err(onError ? onError(error) : (error as E));
	}
};

export const tryCatchAsync = async <T, E = Error>(
	fn: () => Promise<T>,
	onError?: (error: unknown) => E,
): Promise<Result<T, E>> => {
	try {
		const value = await fn();
		return ok(value);
	} catch (error) {
		return err(onError ? onError(error) : (error as E));
	}
};

export const fromNullable = <T>(
	value: T | null | undefined,
): Result<T, null> => {
	if (value === null || value === undefined) {
		return err(null);
	}
	return ok(value);
};

export const combine = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
	const values: T[] = [];
	for (const result of results) {
		if (!result.ok) {
			return result;
		}
		values.push(result.value);
	}
	return ok(values);
};

export const all = combine;

export { ok as Ok, err as Err };
