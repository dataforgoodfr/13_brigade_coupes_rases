import { useLocation } from "@tanstack/react-router"
import L from "leaflet"
import { type RefObject, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { GeoJSON, Marker } from "react-leaflet"

import "@geoman-io/leaflet-geoman-free"
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css"

import { Button } from "@/components/ui/button"
import { ClearCutMapPopUp } from "@/features/clear-cut/components/map/ClearCutMapPopUp"
import { useMapInstance } from "@/features/clear-cut/components/map/Map.context"
import { useNavigateToClearCut } from "@/features/clear-cut/hooks"
import type {
	ClearCut,
	ClearCutReport,
	MultiPolygon
} from "@/features/clear-cut/store/clear-cuts"
import { updateClearCutGeometryThunk } from "@/features/clear-cut/store/clear-cuts-slice"
import { CLEAR_CUTTING_STATUS_COLORS } from "@/features/clear-cut/store/status"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch } from "@/shared/hooks/store"

type Props = { report: ClearCutReport; clearCut: ClearCut }

// Flatten an edited Leaflet GeoJSON output back into a single MultiPolygon.
// biome-ignore lint/suspicious/noExplicitAny: Geoman/Leaflet GeoJSON is untyped
function toMultiPolygon(geojson: any): MultiPolygon {
	const coordinates: MultiPolygon["coordinates"] = []
	// biome-ignore lint/suspicious/noExplicitAny: Geoman/Leaflet GeoJSON is untyped
	const addGeometry = (geometry: any) => {
		if (!geometry) return
		if (geometry.type === "Polygon") coordinates.push(geometry.coordinates)
		else if (geometry.type === "MultiPolygon")
			coordinates.push(...geometry.coordinates)
	}
	if (geojson?.type === "FeatureCollection") {
		for (const feature of geojson.features ?? []) addGeometry(feature.geometry)
	} else if (geojson?.type === "Feature") {
		addGeometry(geojson.geometry)
	} else {
		addGeometry(geojson)
	}
	return { type: "MultiPolygon", coordinates }
}

export function ClearCutPreview({ report, clearCut }: Props) {
	const {
		setFocusedClearCutId,
		focusedClearCutId,
		editingPerimeterReportId,
		setEditingPerimeterReportId
	} = useMapInstance()
	const ref = useRef<L.FeatureGroup>(null)
	const location = useLocation()
	const navigateToDetail = useNavigateToClearCut(report.id)
	const dispatch = useAppDispatch()
	const { toast } = useToast()
	const [isSaving, setIsSaving] = useState(false)

	const isEditingPerimeter = editingPerimeterReportId === report.id
	// Kept in a ref so the (mount-time) click handlers always read the latest value.
	const isEditingRef = useRef(isEditingPerimeter)
	isEditingRef.current = isEditingPerimeter

	// Enable/disable Geoman vertex editing on this layer when entering/leaving
	// perimeter edit mode for this report.
	useEffect(() => {
		// biome-ignore lint/suspicious/noExplicitAny: Geoman augments Leaflet layers
		const layer = ref.current as any
		if (!layer?.eachLayer) return
		// biome-ignore lint/suspicious/noExplicitAny: Geoman augments Leaflet layers
		layer.eachLayer((child: any) => {
			if (isEditingPerimeter) child.pm?.enable({ allowSelfIntersection: false })
			else child.pm?.disable()
		})
	}, [isEditingPerimeter])

	const handleSavePerimeter = async () => {
		const layer = ref.current
		if (!layer) return
		setIsSaving(true)
		try {
			// biome-ignore lint/suspicious/noExplicitAny: Leaflet toGeoJSON is untyped
			const boundary = toMultiPolygon((layer as any).toGeoJSON())
			if (boundary.coordinates.length === 0) throw new Error("empty geometry")
			await dispatch(
				updateClearCutGeometryThunk({
					reportId: report.id,
					clearCutId: clearCut.id,
					boundary
				})
			).unwrap()
			toast({ id: "perimeter-saved", title: "Périmètre mis à jour" })
			setEditingPerimeterReportId(undefined)
		} catch {
			toast({
				id: "perimeter-error",
				title: "Erreur lors de la mise à jour du périmètre"
			})
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancelPerimeter = () => {
		// biome-ignore lint/suspicious/noExplicitAny: Geoman augments Leaflet layers
		const layer = ref.current as any
		if (layer) {
			// biome-ignore lint/suspicious/noExplicitAny: Geoman augments Leaflet layers
			layer.eachLayer?.((child: any) => child.pm?.disable())
			// Revert the on-screen edits by reloading the original geometry.
			layer.clearLayers?.()
			layer.addData?.(clearCut.boundary)
		}
		setEditingPerimeterReportId(undefined)
	}

	useEffect(() => {
		if (focusedClearCutId === report.id) {
			if (ref.current && (ref.current as any)._map) {
				ref.current.openPopup()
			}
		} else {
			if (ref.current && (ref.current as any)._map) {
				ref.current.closePopup()
			}
		}
	}, [focusedClearCutId, report.id])

	// Extract the clear-cut ID from the URL path using a regular expression
	const urlMatch = location.pathname.match(/\/clear-cuts\/([^/]+)/)
	const reportIsOpenInSideList = urlMatch ? urlMatch[1] === report.id : false

	// The clear-cut is considered focused if the map's popup is open or if the report ID
	// in the URL matches the current report (i.e., the report is selected in the aside list).
	const isFocused = focusedClearCutId === report.id || reportIsOpenInSideList

	// Modify the clear-cut polygon style when it is focused
	const weight = isFocused ? 2 : 0
	const fillOpacity = isFocused ? 0.25 : 0.5

	// "i" badge displayed on the zone to hint that clicking reveals its details.
	// (The popup no longer opens on hover, so this invites the click instead.)
	const infoIcon = useMemo(
		() =>
			L.divIcon({
				className: "clear-cut-info-icon",
				html: '<span aria-hidden="true">i</span>',
				iconSize: [22, 22],
				iconAnchor: [11, 11]
			}),
		[]
	)
	const iconPosition = useMemo<[number, number]>(
		() => [clearCut.location.coordinates[1], clearCut.location.coordinates[0]],
		[clearCut.location.coordinates]
	)

	return (
		<>
			<GeoJSON
				key={clearCut.id}
				ref={ref as RefObject<L.GeoJSON>}
				data={clearCut.boundary}
				style={{
					color: `var(--color-${CLEAR_CUTTING_STATUS_COLORS[report.status]})`,
					weight,
					fillOpacity
				}}
				eventHandlers={{
					dblclick: () => {
						if (isEditingRef.current) return
						navigateToDetail()
					},
					click: () => {
						if (isEditingRef.current) return
						navigateToDetail()
					},
					popupopen: () => {
						setFocusedClearCutId(report.id)
					}
				}}
			>
				<ClearCutMapPopUp
					report={report}
					isReportPanelOpen={reportIsOpenInSideList}
				/>
			</GeoJSON>
			{!isEditingPerimeter && (
				<Marker
					position={iconPosition}
					icon={infoIcon}
					interactive
					keyboard={false}
					eventHandlers={{
						click: () => navigateToDetail()
					}}
				/>
			)}
			{isEditingPerimeter &&
				createPortal(
					<div className="fixed bottom-24 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-md border bg-white p-2 shadow-lg">
						<span className="px-2 text-sm">
							Déplacez les sommets pour ajuster le périmètre
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={handleCancelPerimeter}
							disabled={isSaving}
						>
							Annuler
						</Button>
						<Button size="sm" onClick={handleSavePerimeter} disabled={isSaving}>
							{isSaving ? "Enregistrement…" : "Enregistrer le périmètre"}
						</Button>
					</div>,
					document.body
				)}
		</>
	)
}
