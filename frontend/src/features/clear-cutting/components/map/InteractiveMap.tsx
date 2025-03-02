import type { LatLngExpression } from "leaflet";
const franceCenter: LatLngExpression = [46.695554, 2.440236];
const wholeFranceZoom = 7;

import { MapContainer, TileLayer } from "react-leaflet";
import { ClearCuttings } from "./ClearCuttings";
import { useMapInstance } from "./Map.context";

export function InteractiveMap() {
	const { setMap } = useMapInstance();

	return (
		<MapContainer
			className="h-screen w-full z-0"
			center={franceCenter}
			zoom={wholeFranceZoom}
			scrollWheelZoom={true}
			ref={setMap}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<ClearCuttings />
		</MapContainer>
	);
}
