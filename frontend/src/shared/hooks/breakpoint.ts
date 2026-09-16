import { useSyncExternalStore } from "react"

// Same threshold as Tailwind's `sm` breakpoint
const DESKTOP_QUERY = "(min-width: 640px)"

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
