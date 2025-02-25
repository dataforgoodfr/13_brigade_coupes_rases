import { useGetClearCuttingsQuery } from "@/features/clear-cutting/store/api";
import { setGeoBounds } from "@/features/clear-cutting/store/filters.slice";
import { useGeolocation } from "@/shared/hooks/geolocation";
import { useAppDispatch } from "@/shared/hooks/store";
import type { ZoomAnimEventHandlerFn } from "leaflet";
import { useCallback, useEffect, useState } from "react";
import { Circle, Polygon, useMap, useMapEvents } from "react-leaflet";
import {
	DISPLAY_PREVIEW_ZOOM_LEVEL,
	getClearCuttingStatusColor,
} from "@/features/clear-cutting/store/clear-cuttings";
import { ClearCuttingMapPopUp } from "./ClearCuttingMapPopUp";

export function ClearCuttings() {
	const map = useMap();
	const { browserLocation } = useGeolocation();
	const [displayClearCuttingPreview, setDisplayClearCuttingPreview] =
		useState(false);

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

	const onZoomChanged: ZoomAnimEventHandlerFn = (e) => {
		if (e.zoom > DISPLAY_PREVIEW_ZOOM_LEVEL) {
			setDisplayClearCuttingPreview(true);
		} else {
			setDisplayClearCuttingPreview(false);
		}
	};

	useMapEvents({
		zoomanim: onZoomChanged,
		zoomend: dispatchGeoBounds,
		moveend: dispatchGeoBounds,
		resize: dispatchGeoBounds,
	});

	useEffect(() => dispatchGeoBounds(), [dispatchGeoBounds]);

	function ClearCuttingPreview() {
		if (displayClearCuttingPreview) {
			return data?.clearCuttingPreviews.map(
				(clearCutting) => (
					<Polygon
						key={clearCutting.id}
						positions={clearCutting.geoCoordinates}
						color={getClearCuttingStatusColor(clearCutting.status)}
						weight={0}
						fillOpacity={0.75}
					>
						<ClearCuttingMapPopUp clearCutting={clearCutting} />
					</Polygon>
				),
			);
		}
	}

	function ClearCuttingLocationPoint() {
		if (!displayClearCuttingPreview) {
			return data?.clearCuttingsPoints.map(([lat, lng]) => (
				<Circle
					key={`${lat},${lng}`}
					color="#ff6467"
					center={{ lat, lng }}
					radius={200}
					fillOpacity={0.7}
				/>
			));
		}
	}

	return (
		<>
			<ClearCuttingPreview />

			<ClearCuttingLocationPoint />
		</>
	);
}
