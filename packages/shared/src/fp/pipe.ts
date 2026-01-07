export const pipe = <T>(value: T) => ({
	map: <U>(fn: (value: T) => U) => pipe(fn(value)),
	flatMap: <U>(fn: (value: T) => { value: U }) => pipe(fn(value).value),
	filter: (predicate: (value: T) => boolean) =>
		predicate(value) ? pipe(value) : pipe(undefined as T),
	tap: (fn: (value: T) => void) => {
		fn(value);
		return pipe(value);
	},
	value,
});

export const compose =
	<T>(...fns: Array<(arg: T) => T>) =>
	(value: T): T =>
		fns.reduceRight((acc, fn) => fn(acc), value);

export const flow =
	<T>(...fns: Array<(arg: T) => T>) =>
	(value: T): T =>
		fns.reduce((acc, fn) => fn(acc), value);

