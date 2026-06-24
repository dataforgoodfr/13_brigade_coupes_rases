import { useEffect, useState } from "react"

/**
 * Reactive wrapper around `navigator.onLine`.
 *
 * Returns `true` when the browser reports an active network connection and
 * updates whenever the connection is lost or restored. Used to give the user
 * explicit feedback when they are offline (clear cuts are often surveyed in
 * areas with poor coverage).
 */
export function useOnlineStatus(): boolean {
	const [online, setOnline] = useState(() =>
		typeof navigator === "undefined" ? true : navigator.onLine
	)

	useEffect(() => {
		const handleOnline = () => setOnline(true)
		const handleOffline = () => setOnline(false)
		window.addEventListener("online", handleOnline)
		window.addEventListener("offline", handleOffline)
		return () => {
			window.removeEventListener("online", handleOnline)
			window.removeEventListener("offline", handleOffline)
		}
	}, [])

	return online
}
