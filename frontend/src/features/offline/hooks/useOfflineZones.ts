import { useEffect, useState } from "react"

import {
	listOfflineZones,
	OFFLINE_ZONES_CHANGED,
	type OfflineZone
} from "@/features/offline/tiles/offlineZones"

/** The downloaded zones, kept up to date across components. */
export function useOfflineZones(): OfflineZone[] {
	const [zones, setZones] = useState(listOfflineZones)
	useEffect(() => {
		const refresh = () => setZones(listOfflineZones())
		window.addEventListener(OFFLINE_ZONES_CHANGED, refresh)
		// Another tab may have changed them
		window.addEventListener("storage", refresh)
		return () => {
			window.removeEventListener(OFFLINE_ZONES_CHANGED, refresh)
			window.removeEventListener("storage", refresh)
		}
	}, [])
	return zones
}
