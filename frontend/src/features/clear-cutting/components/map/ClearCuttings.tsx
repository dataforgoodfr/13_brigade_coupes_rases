import { DISPLAY_PREVIEW_ZOOM_LEVEL } from "@/features/clear-cutting/store/clear-cuttings";
import { selectClearCuttings } from "@/features/clear-cutting/store/clear-cuttings-slice";
import { setGeoBounds } from "@/features/clear-cutting/store/filters.slice";
import { CLEAR_CUTTING_STATUS_COLORS } from "@/features/clear-cutting/store/status";
import { ToggleGroup } from "@/shared/components/toggle-group/ToggleGroup";
import { useGeolocation } from "@/shared/hooks/geolocation";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { type SelectableItemEnhanced, useSingleSelect } from "@/shared/items";
import type { ZoomAnimEventHandlerFn } from "leaflet";
import * as L from "leaflet";
import { useCallback, useEffect, useState } from "react";
import { Circle, Polygon, useMap, useMapEvents } from "react-leaflet";
import { ClearCuttingMapPopUp } from "./ClearCuttingMapPopUp";

export function ClearCuttings() {
	const map = useMap();
	const { browserLocation } = useGeolocation();
	const [displayClearCuttingPreview, setDisplayClearCuttingPreview] =
		useState(false);

	const [layer, layers, setLayer] = useSingleSelect<
		L.TileLayer,
		SelectableItemEnhanced<L.TileLayer>
	>([
		{
			isSelected: true,
			item: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				id: "OpenStreetMap.Mapnik",
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			}),
			label: "Standard",
			value: "standard",
		},
		{
			isSelected: false,
			item: L.tileLayer("https://b.tile.opentopomap.org/{z}/{x}/{y}.png", {
				id: "OpenTopoMap",
			}),
			label: "Terrain",
			value: "ground",
		},
		{
			isSelected: false,
			item: L.tileLayer(
				"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
				{
					id: "ArcGIS.WorldImagery",
				},
			),
			label: "Satellite",
			value: "satellite",
		},
	]);
	map.attributionControl.setPosition("bottomleft");

	const handleLayerSelected = (
		selectableItem: SelectableItemEnhanced<L.TileLayer> | undefined,
	) => {
		if (layer?.item) {
			map.removeLayer(layer?.item);
		}
		if (selectableItem?.item) {
			map.addLayer(selectableItem.item);
		}
		setLayer(selectableItem);
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
			<div className="leaflet-bottom leaflet-right">
				<div className="leaflet-control bg-zinc-100 p-1 rounded-md ">
					<ToggleGroup
						variant="primary"
						type="single"
						size="xl"
						value={layers}
						onValueChange={handleLayerSelected}
					/>
				</div>
			</div>

			<ClearCuttingPreview />

			<ClearCuttingLocationPoint />
		</>
	);
}
