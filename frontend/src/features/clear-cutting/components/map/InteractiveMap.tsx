import { ClearCuttings } from "@/features/clear-cutting/components/map/ClearCuttings";
import { useMapInstance } from "@/features/clear-cutting/components/map/Map.context";
import { Outlet } from "@tanstack/react-router";
import type { LatLngExpression } from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";

const franceCenter: LatLngExpression = [46.695554, 2.440236];
const wholeFranceZoom = 7;

export function InteractiveMap() {
	const { setMap } = useMapInstance();
	return (
		<>
			<main className="h-screen w-full z-0">
				<MapContainer
					className="h-full"
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
			</main>

			<div className="m-3 lg:inset-y-0 lg:z-50 lg:flex lg:w-200 lg:flex-col px-0.5">
				<Outlet />
			</div>
		</>
	);
}
