import { createContext, useContext, useState } from "react"

import type { MultiPolygon } from "@/features/clear-cut/store/clear-cuts"

export type MapContext = {
	map: L.Map | null
	setMap: (map: L.Map | null) => void
	focusedClearCutId?: string
	setFocusedClearCutId: (id?: string) => void
	/** Report whose perimeter is currently being edited on the map, if any. */
	editingPerimeterReportId?: string
	setEditingPerimeterReportId: (id?: string) => void
	/** Perimeter replaced by a manual correction, drawn over the map. */
	previousBoundary?: PreviousBoundary
	setPreviousBoundary: (boundary?: PreviousBoundary) => void
} | null

export type PreviousBoundary = { key: string; boundary: MultiPolygon }
const MapCtx = createContext<MapContext>(null)

export const useMapInstance = () => {
	const context = useContext<MapContext>(MapCtx)
	if (!context)
		throw new Error("useMapInstance must be used within a MapProvider")
	return context
}

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
	const [map, setMap] = useState<L.Map | null>(null)
	const [focusedClearCutId, setFocusedClearCutId] = useState<string>()
	const [editingPerimeterReportId, setEditingPerimeterReportId] =
		useState<string>()
	const [previousBoundary, setPreviousBoundary] = useState<PreviousBoundary>()
	return (
		<MapCtx.Provider
			value={{
				focusedClearCutId,
				setFocusedClearCutId,
				editingPerimeterReportId,
				setEditingPerimeterReportId,
				previousBoundary,
				setPreviousBoundary,
				map,
				setMap
			}}
		>
			{children}
		</MapCtx.Provider>
	)
}
