import { ClearCutMapPopUp } from "@/features/clear-cut/components/map/ClearCutMapPopUp";
import { useMapInstance } from "@/features/clear-cut/components/map/Map.context";
import type {
	ClearCut,
	ClearCutReport,
} from "@/features/clear-cut/store/clear-cuts";
import { CLEAR_CUTTING_STATUS_COLORS } from "@/features/clear-cut/store/status";
import { type RefObject, useEffect, useRef } from "react";
import { GeoJSON } from "react-leaflet";
type Props = { report: ClearCutReport; clearCut: ClearCut };
export function ClearCutPreview({ report, clearCut }: Props) {
	const { setFocusedClearCutId, focusedClearCutId } = useMapInstance();
	const ref = useRef<L.FeatureGroup>(null);
	useEffect(() => {
		if (focusedClearCutId === report.id) {
			ref.current?.openPopup();
		} else {
			ref.current?.closePopup();
		}
	}, [focusedClearCutId, report.id]);
	return (
		<GeoJSON
			key={clearCut.id}
			ref={ref as RefObject<L.GeoJSON>}
			data={clearCut.boundary}
			style={{
				color: `var(--color-${CLEAR_CUTTING_STATUS_COLORS[report.status]})`,
				weight: 0,
				fillOpacity: 0.75,
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
