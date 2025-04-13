export function ic(val?: string) {
	return new RegExp(`${val}`, "i");
}
