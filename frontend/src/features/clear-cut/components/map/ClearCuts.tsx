import * as L from "leaflet"
import { ListIcon, Locate } from "lucide-react"
import { useCallback, useEffect, useMemo } from "react"
import { CircleMarker, useMap, useMapEvents } from "react-leaflet"

import { useLayout } from "@/features/clear-cut/components/Layout.context"
import { ClearCutPreview } from "@/features/clear-cut/components/map/ClearCutPreview"
import { useMapInstance } from "@/features/clear-cut/components/map/Map.context"
import { MobileControl } from "@/features/clear-cut/components/map/MobileControl"
import { DISPLAY_PREVIEW_ZOOM_LEVEL } from "@/features/clear-cut/store/clear-cuts"
import { selectClearCuts } from "@/features/clear-cut/store/clear-cuts-slice"
import {
	selectWithPoints,
	setGeoBounds,
	setWithPoints
} from "@/features/clear-cut/store/filters.slice"
import { IconButton } from "@/shared/components/button/Button"
import { AddressInput } from "@/shared/components/input/AddressInput"
import { ToggleGroup } from "@/shared/components/toggle-group/ToggleGroup"
import { useBreakpoint } from "@/shared/hooks/breakpoint"
import { useGeolocation } from "@/shared/hooks/geolocation"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"
import { type SelectableItemEnhanced, useSingleSelect } from "@/shared/items"

const LAYERS: SelectableItemEnhanced<L.TileLayer>[] = [
	{
		isSelected: true,
		item: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			id: "OpenStreetMap.Mapnik",
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}),
		label: "Standard",
		value: "standard"
	},
	{
		isSelected: false,
		item: L.tileLayer("https://b.tile.opentopomap.org/{z}/{x}/{y}.png", {
			id: "OpenTopoMap"
		}),
		label: "Terrain",
		value: "ground"
	},
	{
		isSelected: false,
		item: L.tileLayer(
			"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
			{
				id: "ArcGIS.WorldImagery"
			}
		),
		label: "Satellite",
		value: "satellite"
	}
]

function getPointRadius(currentPointCnt: number, mapSize: L.Point) {
	const size = Math.min(mapSize.x, mapSize.y)
	const pointRadius = currentPointCnt / size
	const radius = pointRadius * 10
	return Math.max(radius, 3)
}

export function ClearCuts() {
	const map = useMap()
	const { setFocusedClearCutId, focusedClearCutId, setMap } = useMapInstance()
	const { layout, setLayout } = useLayout()
	const { breakpoint } = useBreakpoint()
	useEffect(() => {
		setMap(map)
	}, [map, setMap])
	const { browserLocation } = useGeolocation()
	const displayPoints = useAppSelector(selectWithPoints)
	const [layer, layers, setLayer] = useSingleSelect<
		L.TileLayer,
		SelectableItemEnhanced<L.TileLayer>
	>(LAYERS)
	map.attributionControl.setPosition("bottomleft")
	map.zoomControl.setPosition("bottomright")

	const handleLayerSelected = (
		selectableItem: SelectableItemEnhanced<L.TileLayer>
	) => {
		if (layer?.item) {
			map.removeLayer(layer?.item)
		}
		map.addLayer(selectableItem.item)
		setLayer(selectableItem)
	}

	const centerOnUserLocation = useCallback(() => {
		if (browserLocation) {
			map.setView({
				lat: browserLocation.coords.latitude,
				lng: browserLocation.coords.longitude
			})
		}
	}, [browserLocation, map.setView])

	const dispatch = useAppDispatch()

	useEffect(() => {
		dispatch(setWithPoints(true))
	}, [dispatch])

	const { value } = useAppSelector(selectClearCuts)

	const dispatchGeoBounds = useCallback(() => {
		const bounds = map.getBounds()
		const northEast = bounds.getNorthEast()
		const southWest = bounds.getSouthWest()
		dispatch(
			setGeoBounds({
				ne: { lat: northEast.lat, lng: northEast.lng },
				sw: { lat: southWest.lat, lng: southWest.lng }
			})
		)
	}, [map, dispatch])

	const centerOnCoordinates = (coordinates: [number, number]) => {
		map.setView({
			lat: coordinates[1],
			lng: coordinates[0]
		})
		dispatchGeoBounds()
	}

	const onZoomEnd = () => {
		const currentZoom = map.getZoom()
		if (currentZoom > DISPLAY_PREVIEW_ZOOM_LEVEL) {
			dispatch(setWithPoints(false))
		} else {
			dispatch(setWithPoints(true))
		}
		dispatchGeoBounds()
	}

	useMapEvents({
		zoomend: onZoomEnd,
		dragend: () => {
			dispatchGeoBounds()
		},
		resize: () => {
			dispatchGeoBounds()
		},
		popupclose: () => {
			setFocusedClearCutId(undefined)
		}
	})

	useEffect(() => dispatchGeoBounds(), [dispatchGeoBounds])

	const previews = useMemo(() => {
		if (!displayPoints) {
			return value?.previews.flatMap((clearCut) =>
				clearCut.clearCuts.map((cut) => (
					<ClearCutPreview key={cut.id} report={clearCut} clearCut={cut} />
				))
			)
		}
	}, [displayPoints, value?.previews])

	const points = useMemo(() => {
		if (displayPoints) {
			return value?.points.content.map(({ point, count }) => (
				<CircleMarker
					key={`${point.coordinates[0]},${point.coordinates[1]}`}
					color="#ff6467"
					center={{
						lat: point.coordinates[1],
						lng: point.coordinates[0]
					}}
					radius={getPointRadius(count, map.getSize())}
					fillOpacity={0.7}
				/>
			))
		}
	}, [displayPoints, value?.points, map])

	const iconButton = (
		<IconButton
			variant="white"
			className="mx-1"
			onClick={() => setLayout("list")}
			icon={<ListIcon />}
			title="Afficher la liste"
			position="start"
		/>
	)
	return (
		<>
			<div className="sm:p-1 justify-end leaflet-top flex w-full z-10">
				<div className="leaflet-control flex p-1 rounded-md z-10 flex-col sm:flex-row gap-2 w-full">
					<div className="w-full sm:max-w-100">
						<AddressInput onSelect={centerOnCoordinates} />
					</div>
					<div className="justify-end w-full flex flex-row">
						{browserLocation && (
							<IconButton
								icon={<Locate />}
								className="hidden sm:flex"
								onClick={centerOnUserLocation}
								position={"end"}
							>
								Centrer sur ma position
							</IconButton>
						)}
						{breakpoint === "all" && layout === "map" && iconButton}
						<MobileControl clearCutId={focusedClearCutId}>
							<IconButton
								icon={<Locate />}
								onClick={centerOnUserLocation}
								position={"end"}
							/>
							{iconButton}
						</MobileControl>
					</div>
				</div>
			</div>
			<div className="leaflet-bottom leaflet-left mb-3">
				<div className="leaflet-control bg-zinc-100 p-1 rounded-md ">
					<ToggleGroup
						variant="primary"
						type="single"
						allowEmptyValue={false}
						size="sm"
						value={layers}
						onValueChange={handleLayerSelected}
					/>
				</div>
			</div>
			{previews}
			{points}
		</>
	)
}
