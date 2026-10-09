import "leaflet/dist/leaflet.css"

import type { Map as LeafletMap } from "leaflet"
import { createRef } from "react"
import { MapContainer } from "react-leaflet"
import { describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

import { CountedPointMarker } from "@/features/clear-cut/components/map/CountedPointMarker"
import {
	type CountedPoint,
	DISPLAY_PREVIEW_ZOOM_LEVEL
} from "@/features/clear-cut/store/clear-cuts"

// Three cuts around Limoges, drawn at their centroid
const BOUNDS: [number, number, number, number] = [1.0, 45.6, 1.6, 46.1]
const CLUSTER: CountedPoint = {
	count: 3,
	point: { type: "Point", coordinates: [1.25, 45.8] },
	bounds: BOUNDS
}

/** The marker on a map of the whole of France, and that map. */
async function renderMarker(countedPoint: CountedPoint) {
	const mapRef = createRef<LeafletMap>()
	await render(
		<MapContainer
			ref={mapRef}
			center={{ lat: 46.6, lng: 2.4 }}
			zoom={5}
			zoomAnimation={false}
			style={{ height: 400, width: 400 }}
		>
			<CountedPointMarker countedPoint={countedPoint} />
		</MapContainer>
	)
	const map = mapRef.current
	if (!map) throw new Error("map not created")
	const marker = document.querySelector("path.leaflet-interactive")
	if (!marker) throw new Error("marker not drawn")
	return { map, marker }
}

describe("CountedPointMarker", () => {
	it("shows the number of cuts of a cluster", async () => {
		await renderMarker(CLUSTER)

		expect(document.querySelector(".leaflet-tooltip")?.textContent).toBe("3")
	})

	it("zooms on a cluster until all its cuts are in view", async () => {
		const { map, marker } = await renderMarker(CLUSTER)

		await userEvent.click(marker)

		const [west, south, east, north] = BOUNDS
		await expect.poll(() => map.getZoom()).toBeGreaterThan(5)
		const view = map.getBounds()
		expect(view.contains([south, west])).toBe(true)
		expect(view.contains([north, east])).toBe(true)
	})

	it("opens a single cut at the zoom showing its outline", async () => {
		const { map, marker } = await renderMarker({
			count: 1,
			point: { type: "Point", coordinates: [1.25, 45.8] }
		})

		expect(document.querySelector(".leaflet-tooltip")).toBeNull()
		await userEvent.click(marker)

		await expect.poll(() => map.getZoom()).toBe(DISPLAY_PREVIEW_ZOOM_LEVEL + 1)
	})
})
