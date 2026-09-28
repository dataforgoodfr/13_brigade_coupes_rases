import { useSyncExternalStore } from "react"

// Same condition as the `sm` variant redefined in index.css: a phone turned
// sideways is wide but short, and keeps the mobile layout
const DESKTOP_QUERY =
	"(min-width: 640px) and ((min-height: 640px) or (pointer: fine))"

export type Breakpoint = "mobile" | "all"

const subscribe = (onChange: () => void) => {
	const list = window.matchMedia(DESKTOP_QUERY)
	list.addEventListener("change", onChange)
	return () => list.removeEventListener("change", onChange)
}
const getSnapshot = (): Breakpoint =>
	window.matchMedia(DESKTOP_QUERY).matches ? "all" : "mobile"

export function useBreakpoint(): { breakpoint: Breakpoint } {
	return { breakpoint: useSyncExternalStore(subscribe, getSnapshot) }
}
