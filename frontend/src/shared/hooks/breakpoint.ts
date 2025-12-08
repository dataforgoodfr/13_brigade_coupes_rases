import useBp from "use-breakpoint"

const BREAKPOINTS = {
	mobile: 0,
	all: 640
}
export function useBreakpoint() {
	return useBp(BREAKPOINTS)
}
