import { useCallback, useRef } from "react"

/**
 * Runs a sending action unless the previous one is still running: a second
 * tap, or a burst of identical events, cannot send it twice. Unlike a button
 * disabled at the next render, the check is synchronous.
 */
export function useSingleFlight() {
	const runningRef = useRef(false)
	return useCallback(async (send: () => unknown) => {
		if (runningRef.current) return
		runningRef.current = true
		try {
			await send()
		} finally {
			runningRef.current = false
		}
	}, [])
}
