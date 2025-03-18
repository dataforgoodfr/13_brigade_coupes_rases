import { DISPLAY_PREVIEW_ZOOM_LEVEL } from "@/features/clear-cutting/store/clear-cuttings";
import { selectClearCuttings } from "@/features/clear-cutting/store/clear-cuttings-slice";
import { setGeoBounds } from "@/features/clear-cutting/store/filters.slice";
import { CLEAR_CUTTING_STATUS_COLORS } from "@/features/clear-cutting/store/status";
import { useGeolocation } from "@/shared/hooks/geolocation";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import type { ZoomAnimEventHandlerFn } from "leaflet";
import { useCallback, useEffect, useState } from "react";
import { Circle, Polygon, useMap, useMapEvents } from "react-leaflet";
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
	const { value } = useAppSelector(selectClearCuttings);

	const dispatchGeoBounds = useCallback(() => {
		const bounds = map.getBounds();
		const northEast = bounds.getNorthEast();
		const southWest = bounds.getSouthWest();
		dispatch(
			setGeoBounds({
				ne: { lat: northEast.lat, lng: northEast.lng },
				sw: { lat: southWest.lat, lng: southWest.lng },
			}),
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
			return value?.clearCuttingPreviews.map((clearCutting) => {
				return (
					<Polygon
						key={clearCutting.id}
						className="clear-cutting-area"
						positions={clearCutting.geoCoordinates}
						color={`var(--color-${CLEAR_CUTTING_STATUS_COLORS[clearCutting.status.name]})`}
						weight={0}
						fillOpacity={0.75}
						eventHandlers={{
							mouseover: (event) => {
								event.target.openPopup();
							},
							mouseout: (event) => {
								event.target.closePopup();
							},
						}}
					>
						<ClearCuttingMapPopUp clearCutting={clearCutting} />
					</Polygon>
				);
			});
		}
	}

	function ClearCuttingLocationPoint() {
		if (!displayClearCuttingPreview) {
			return value?.clearCuttingsPoints.map(([lat, lng]) => (
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
