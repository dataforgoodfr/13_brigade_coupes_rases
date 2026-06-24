import { useLocation } from "@tanstack/react-router"
import L from "leaflet"
import { type RefObject, useEffect, useMemo, useRef } from "react"
import { GeoJSON, Marker } from "react-leaflet"

import { ClearCutMapPopUp } from "@/features/clear-cut/components/map/ClearCutMapPopUp"
import { useMapInstance } from "@/features/clear-cut/components/map/Map.context"
import { useNavigateToClearCut } from "@/features/clear-cut/hooks"
import type {
	ClearCut,
	ClearCutReport
} from "@/features/clear-cut/store/clear-cuts"
import { CLEAR_CUTTING_STATUS_COLORS } from "@/features/clear-cut/store/status"

type Props = { report: ClearCutReport; clearCut: ClearCut }

export function ClearCutPreview({ report, clearCut }: Props) {
	const { setFocusedClearCutId, focusedClearCutId } = useMapInstance()
	const ref = useRef<L.FeatureGroup>(null)
	const location = useLocation()
	const navigateToDetail = useNavigateToClearCut(report.id)
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
						navigateToDetail()
					},
					click: () => {
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
			<Marker
				position={iconPosition}
				icon={infoIcon}
				interactive
				keyboard={false}
				eventHandlers={{
					click: () => navigateToDetail()
				}}
			/>
		</>
	)
}
