import { ClearCutPreview } from "@/features/clear-cut/components/map/ClearCutPreview";
import { useMapInstance } from "@/features/clear-cut/components/map/Map.context";
import { MobileControl } from "@/features/clear-cut/components/map/MobileControl";
import { DISPLAY_PREVIEW_ZOOM_LEVEL } from "@/features/clear-cut/store/clear-cuts";
import { selectClearCuts } from "@/features/clear-cut/store/clear-cuts-slice";
import {
	selectWithPoints,
	setGeoBounds,
	setWithPoints,
} from "@/features/clear-cut/store/filters.slice";
import { IconButton } from "@/shared/components/button/Button";
import { ToggleGroup } from "@/shared/components/toggle-group/ToggleGroup";
import { useGeolocation } from "@/shared/hooks/geolocation";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { type SelectableItemEnhanced, useSingleSelect } from "@/shared/items";
import type { ZoomAnimEventHandlerFn } from "leaflet";
import * as L from "leaflet";
import { Locate } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { Circle, useMap, useMapEvents } from "react-leaflet";

const LAYERS: SelectableItemEnhanced<L.TileLayer>[] = [
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
];
const MAX_RADIUS = 10_000;
function getPointRadius(pointsCnt: number, currentPointCnt: number) {
	if (pointsCnt < 100) {
		return 1000;
	}
	return MAX_RADIUS * ((currentPointCnt / pointsCnt) * 5);
}
export function ClearCuts() {
	const map = useMap();
	const { setFocusedClearCutId, focusedClearCutId } = useMapInstance();
	const { browserLocation } = useGeolocation();
	const displayPoints = useAppSelector(selectWithPoints);
	const [layer, layers, setLayer] = useSingleSelect<
		L.TileLayer,
		SelectableItemEnhanced<L.TileLayer>
	>(LAYERS);
	map.attributionControl.setPosition("bottomleft");

	const handleLayerSelected = (
		selectableItem: SelectableItemEnhanced<L.TileLayer>,
	) => {
		if (layer?.item) {
			map.removeLayer(layer?.item);
		}
		map.addLayer(selectableItem.item);
		setLayer(selectableItem);
	};

	const centerOnUserLocation = useCallback(() => {
		if (browserLocation) {
			map.setView({
				lat: browserLocation.coords.latitude,
				lng: browserLocation.coords.longitude,
			});
		}
	}, [browserLocation, map.setView]);

	const dispatch = useAppDispatch();
	useEffect(() => {
		dispatch(setWithPoints(true));
	}, [dispatch]);
	const { value } = useAppSelector(selectClearCuts);
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
			dispatch(setWithPoints(false));
		} else {
			dispatch(setWithPoints(true));
		}
	};

	const onZoomEnd = () => {
		const currentZoom = map.getZoom();
		if (currentZoom > DISPLAY_PREVIEW_ZOOM_LEVEL) {
			dispatch(setWithPoints(false));
		} else {
			dispatch(setWithPoints(true));
		}
		dispatchGeoBounds();
	};

	useMapEvents({
		zoomanim: onZoomChanged,
		zoomend: onZoomEnd,
		dragend: () => {
			dispatchGeoBounds();
		},
		resize: () => {
			dispatchGeoBounds();
		},
		popupclose: () => {
			setFocusedClearCutId(undefined);
		},
	});

	useEffect(() => dispatchGeoBounds(), [dispatchGeoBounds]);

	const previews = useMemo(() => {
		if (!displayPoints) {
			return value?.previews.flatMap((clearCut) =>
				clearCut.clear_cuts.map((cut) => (
					<ClearCutPreview key={cut.id} report={clearCut} clearCut={cut} />
				)),
			);
		}
	}, [displayPoints, value?.previews]);
	const points = useMemo(() => {
		if (displayPoints) {
			return value?.points.content.map(({ point, count }) => (
				<Circle
					key={`${point.coordinates[0]},${point.coordinates[1]}`}
					color="#ff6467"
					center={{
						lat: point.coordinates[1],
						lng: point.coordinates[0],
					}}
					radius={getPointRadius(value.points.total, count)}
					fillOpacity={0.7}
				/>
			));
		}
	}, [displayPoints, value?.points]);

	return (
		<>
			<div className="sm:p-1 justify-end leaflet-top flex  w-full z-10">
				<div className="leaflet-control flex p-1 rounded-md justify-end z-10">
					<IconButton
						icon={<Locate />}
						className="hidden sm:flex"
						onClick={centerOnUserLocation}
						position={"end"}
					>
						Centrer sur ma position
					</IconButton>
					<MobileControl clearCutId={focusedClearCutId}>
						<IconButton
							icon={<Locate />}
							onClick={centerOnUserLocation}
							position={"end"}
						/>
					</MobileControl>
				</div>
			</div>
			<div className="leaflet-bottom leaflet-right">
				<div className="leaflet-control bg-zinc-100 p-1 rounded-md ">
					<ToggleGroup
						variant="primary"
						type="single"
						allowEmptyValue={false}
						size="xl"
						value={layers}
						onValueChange={handleLayerSelected}
					/>
				</div>
			</div>
			{previews}
			{points}
		</>
	);
}
