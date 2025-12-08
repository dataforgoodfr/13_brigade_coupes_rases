import { createContext, useContext, useState } from "react"

export type MapContext = {
	map: L.Map | null
	setMap: (map: L.Map) => void
	focusedClearCutId?: string
	setFocusedClearCutId: (id?: string) => void
} | null
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
	return (
		<MapCtx.Provider
			value={{
				focusedClearCutId,
				setFocusedClearCutId,
				map,
				setMap
			}}
		>
			{children}
		</MapCtx.Provider>
	)
}
