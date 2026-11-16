import { GeoJSON } from "react-leaflet"

import { useMapInstance } from "@/features/clear-cut/components/map/Map.context"

/** Draws, dashed, the perimeter an admin picked in a clear cut's history. */
export function PreviousBoundary() {
	const { previousBoundary } = useMapInstance()
	if (!previousBoundary) return null
	return (
		<GeoJSON
			key={previousBoundary.key}
			data={previousBoundary.boundary}
			interactive={false}
			style={{
				color: "#374151",
				weight: 2,
				dashArray: "6 6",
				fillOpacity: 0
			}}
		/>
	)
}
