export const range = <T>(n: number, generator: () => T) => {
	return Array.from({ length: n }, generator);
};
