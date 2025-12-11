import type { LatLngExpression, Map as LeafletMap } from "leaflet"
import { useEffect, useRef } from "react"
import { MapContainer, TileLayer } from "react-leaflet"

import { useLayout } from "@/features/clear-cut/components/Layout.context"
import { cn } from "@/lib/utils"

import { ClearCuts } from "./ClearCuts"

const FRANCE_CENTER: LatLngExpression = [46.695554, 2.440236]
const WHOLE_FRANCE_ZOOM = 6

export function InteractiveMap() {
	const mapRef = useRef<LeafletMap>(null)
	const { layout } = useLayout()

	useEffect(() => {
		if (layout) {
			mapRef.current?.invalidateSize()
		}
	}, [layout])

	// Hide map if in test environment
	if (import.meta.env.MODE === "test") {
		return null
	}

	return (
		<MapContainer
			ref={mapRef}
			className={cn("h-full w-full z-0", layout === "map" && "rounded-md")}
			center={FRANCE_CENTER}
			zoom={WHOLE_FRANCE_ZOOM}
			scrollWheelZoom
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<ClearCuts />
		</MapContainer>
	)
}
