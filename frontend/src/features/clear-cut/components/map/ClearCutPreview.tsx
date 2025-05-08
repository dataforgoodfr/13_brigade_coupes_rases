import { ClearCutMapPopUp } from "@/features/clear-cut/components/map/ClearCutMapPopUp";
import { useMapInstance } from "@/features/clear-cut/components/map/Map.context";
import type {
	ClearCut,
	ClearCutReport,
} from "@/features/clear-cut/store/clear-cuts";
import { CLEAR_CUTTING_STATUS_COLORS } from "@/features/clear-cut/store/status";
import { useLocation } from "@tanstack/react-router";
import { type RefObject, useEffect, useRef } from "react";
import { GeoJSON } from "react-leaflet";

type Props = { report: ClearCutReport; clearCut: ClearCut };

export function ClearCutPreview({ report, clearCut }: Props) {
	const { setFocusedClearCutId, focusedClearCutId } = useMapInstance();
	const ref = useRef<L.FeatureGroup>(null);
	const location = useLocation();

	useEffect(() => {
		if (focusedClearCutId === report.id) {
			ref.current?.openPopup();
		} else {
			ref.current?.closePopup();
		}
	}, [focusedClearCutId, report.id]);

	// Extract the clear-cut ID from the URL path using a regular expression
	const match = location.pathname.match(/\/clear-cuts\/(\d+)/);
	const isUrlMatch = match ? match[1] === report.id : false;

	// The clear-cut is considered focused if the map's popup is open or if the report ID
	// in the URL matches the current report (i.e., the report is selected in the aside list).
	const isFocused = focusedClearCutId === report.id || isUrlMatch;

	// Modify the clear-cut polygon style when it is focused
	const weight = isFocused ? 2 : 0;
	const fillOpacity = isFocused ? 0.25 : 0.5;

	return (
		<GeoJSON
			key={clearCut.id}
			ref={ref as RefObject<L.GeoJSON>}
			data={clearCut.boundary}
			style={{
				color: `var(--color-${CLEAR_CUTTING_STATUS_COLORS[report.status]})`,
				weight,
				fillOpacity,
			}}
			eventHandlers={{
				mouseover: (event) => {
					event.target.openPopup();
				},
				mouseout: (event) => {
					event.target.closePopup();
				},
				click: (event) => {
					event.target.openPopup();
				},
				popupopen: () => {
					setFocusedClearCutId(report.id);
				},
			}}
		>
			<ClearCutMapPopUp report={report} />
		</GeoJSON>
	);
}
