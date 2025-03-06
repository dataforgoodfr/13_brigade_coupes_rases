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
import * as L from "leaflet";
import ButtonGroup from "@/shared/components/button/ButtonGroup";

export function ClearCuttings() {
	const map = useMap();
	const { browserLocation } = useGeolocation();
	const [displayClearCuttingPreview, setDisplayClearCuttingPreview] =
		useState(false);

	map.attributionControl.setPosition("bottomleft");

	const layers = {
		Standard: L.tileLayer(
			"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
			{
				id: "OpenStreetMap.Mapnik",
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			},
		),
		Terrain: L.tileLayer("https://b.tile.opentopomap.org/{z}/{x}/{y}.png", {
			id: "OpenTopoMap",

		}),
		Light: L.tileLayer(
			"https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
			{
				id: "CartoDB.Positron",
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
			},
		),
	} as Record<string, L.TileLayer>;

	const onLayerSelected = (current: string, previous: string) => {
		const previousLayer = layers[previous];
		const currentLayer = layers[current];

		map.removeLayer(previousLayer);
		map.addLayer(currentLayer);
	};

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
			return value?.clearCuttingPreviews.map((clearCutting) => {
				return (
					<Polygon
						key={clearCutting.id}
						className="clear-cutting-area"
						positions={clearCutting.geoCoordinates}
						color={`var(--color-${CLEAR_CUTTING_STATUS_COLORS[clearCutting.status]})`}
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
			<div className="absolute bottom-5 right-5">
				<ButtonGroup options={Object.keys(layers)} onSelect={onLayerSelected} />
			</div>

			<ClearCuttingPreview />

			<ClearCuttingLocationPoint />
		</>
	);
}
