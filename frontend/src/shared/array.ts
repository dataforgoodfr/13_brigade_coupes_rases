export const range = <T>(n: number, generator: () => T) => {
	return Array.from({ length: n }, generator);
};

export type ItemFromRecord<R> = R extends Record<infer K, infer V>
	? { id: K } & V
	: never;
