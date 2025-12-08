import type { LatLngExpression } from "leaflet"

const franceCenter: LatLngExpression = [46.695554, 2.440236]
const wholeFranceZoom = 7

import { MapContainer, TileLayer } from "react-leaflet"

import { ClearCuts } from "./ClearCuts"

export function InteractiveMap() {
	return (
		<MapContainer
			className="h-full w-full z-0"
			center={franceCenter}
			zoom={wholeFranceZoom}
			scrollWheelZoom={true}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<ClearCuts />
		</MapContainer>
	)
}
