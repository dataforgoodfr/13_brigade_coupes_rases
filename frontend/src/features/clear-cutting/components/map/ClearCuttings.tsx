import { useGetClearCuttingsQuery } from "@/features/clear-cutting/store/api";
import { setGeoBounds } from "@/features/clear-cutting/store/filters.slice";
import { useGeolocation } from "@/shared/hooks/geolocation";
import { useAppDispatch } from "@/shared/hooks/store";
import { useCallback, useEffect } from "react";
import { Circle, useMap, useMapEvents } from "react-leaflet";
export function ClearCuttings() {
	const map = useMap();
	const { browserLocation } = useGeolocation();
	useEffect(() => {
		if (browserLocation) {
			map.setView({
				lat: browserLocation.coords.latitude,
				lng: browserLocation.coords.longitude,
			});
		}
	}, [browserLocation, map.setView]);
	const dispatch = useAppDispatch();
	const { data } = useGetClearCuttingsQuery();
	const dispatchGeoBounds = useCallback(() => {
		const bounds = map.getBounds();
		const northEast = bounds.getNorthEast();
		const southWest = bounds.getSouthWest();
		dispatch(
			setGeoBounds([
				[northEast.lat, northEast.lng],
				[southWest.lat, southWest.lng],
			]),
		);
	}, [map, dispatch]);

	useMapEvents({
		zoomend: dispatchGeoBounds,
		moveend: dispatchGeoBounds,
		resize: dispatchGeoBounds,
	});

	useEffect(() => dispatchGeoBounds(), [dispatchGeoBounds]);

	return (
		<>
			{data?.clearCuttingsPoints.map(([lat, lng]) => (
				<Circle
					key={`${lat},${lng}`}
					color="#ff6467"
					center={{ lat, lng }}
					radius={200}
					fillOpacity={0.7}
				/>
			))}
		</>
	);
}
