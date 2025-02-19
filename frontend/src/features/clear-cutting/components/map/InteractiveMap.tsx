import { ClearCuttings } from "@/features/clear-cutting/components/map/ClearCuttings";
import { useGeolocation } from "@/shared/hooks/geolocation";
import type { LatLngExpression } from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";
const franceCenter: LatLngExpression = [46.695554, 2.440236];
const wholeFranceZoom = 7;
export function InteractiveMap() {
	const { browserLocation } = useGeolocation();
	console.log(browserLocation);

	return (
		<MapContainer
			className="h-full"
			center={franceCenter}
			zoom={wholeFranceZoom}
			scrollWheelZoom={true}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<ClearCuttings />
		</MapContainer>
	);
}
