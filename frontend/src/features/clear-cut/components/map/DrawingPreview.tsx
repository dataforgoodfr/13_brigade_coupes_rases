import L from "leaflet"
import { useEffect } from "react"
import { useMap } from "react-leaflet"

import { ringAreaHectare } from "@/shared/geometry"

const formatArea = (hectares: number) =>
	`${hectares.toLocaleString("fr-FR", {
		maximumFractionDigits: hectares < 10 ? 2 : 1
	})} ha`

/**
 * While a cut is drawn by hand, Geoman only shows the line through the placed
 * vertices (and, with a mouse, a hint line to the pointer: none on a phone).
 * This draws the closed, filled perimeter and its area after each vertex.
 */
export function DrawingPreview() {
	const map = useMap()

	useEffect(() => {
		let preview: L.Polygon | undefined
		let workingLayer: L.Layer | undefined

		const clear = () => {
			preview?.remove()
			preview = undefined
		}
		const update = (latLngs: L.LatLng[]) => {
			if (latLngs.length < 3) {
				clear()
				return
			}
			const area = formatArea(
				ringAreaHectare(latLngs.map(({ lat, lng }) => [lng, lat]))
			)
			if (!preview) {
				preview = L.polygon(latLngs, {
					interactive: false,
					color: "#2563eb",
					weight: 1,
					dashArray: "4 4",
					fillOpacity: 0.2
				})
					.bindTooltip(area, {
						permanent: true,
						direction: "center",
						className: "drawing-area-tooltip"
					})
					.addTo(map)
			} else {
				preview.setLatLngs(latLngs)
				preview.setTooltipContent(area)
			}
		}
		const handleChange = (event: L.LeafletEvent & { latlngs?: unknown }) =>
			update(((event.target as L.Polyline).getLatLngs() as L.LatLng[]).flat())
		const detach = () => {
			workingLayer?.off("pm:change", handleChange)
			workingLayer = undefined
			clear()
		}
		const handleDrawStart = (event: {
			shape: string
			workingLayer: L.Layer
		}) => {
			detach()
			if (event.shape !== "Polygon") return
			workingLayer = event.workingLayer
			workingLayer.on("pm:change", handleChange)
		}

		map.on("pm:drawstart", handleDrawStart)
		map.on("pm:drawend", detach)
		return () => {
			map.off("pm:drawstart", handleDrawStart)
			map.off("pm:drawend", detach)
			detach()
		}
	}, [map])

	return null
}
