import "leaflet/dist/leaflet.css"

import { useEffect } from "react"
import { MapContainer, useMap } from "react-leaflet"
import { afterEach, describe, expect, it } from "vitest"
import { render } from "vitest-browser-react"

import { offlineTileLayer } from "@/features/offline/tiles/OfflineTileLayer"
import { OFFLINE_TILES_CACHE } from "@/features/offline/tiles/offlineZones"

const TEMPLATE = "/offline-test-tiles/{z}/{x}/{y}.png"

// A 1×1 transparent PNG
const PNG = Uint8Array.from(
	atob(
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
	),
	(c) => c.charCodeAt(0)
)

function Layer() {
	const map = useMap()
	useEffect(() => {
		const layer = offlineTileLayer(TEMPLATE).addTo(map)
		return () => {
			layer.remove()
		}
	}, [map])
	return null
}

const tileSources = () =>
	[...document.querySelectorAll<HTMLImageElement>("img.leaflet-tile")].map(
		(img) => img.getAttribute("src") ?? ""
	)

describe("OfflineTileLayer", () => {
	afterEach(() => caches.delete(OFFLINE_TILES_CACHE))

	it("shows the stored tiles and asks the network for the others", async () => {
		const cache = await caches.open(OFFLINE_TILES_CACHE)
		// The tile at the centre of a world map at zoom 1
		await cache.put(
			"/offline-test-tiles/1/0/0.png",
			new Response(PNG, { headers: { "content-type": "image/png" } })
		)
		await render(
			<MapContainer
				center={{ lat: 0, lng: 0 }}
				zoom={1}
				zoomAnimation={false}
				fadeAnimation={false}
				style={{ height: 512, width: 512 }}
			>
				<Layer />
			</MapContainer>
		)
		await expect
			.poll(() => tileSources().filter((src) => src !== "").length)
			.toBe(4)
		const sources = tileSources()
		expect(sources.filter((src) => src.startsWith("blob:"))).toHaveLength(1)
		expect(sources).toContain("/offline-test-tiles/1/1/0.png")
		expect(sources).not.toContain("/offline-test-tiles/1/0/0.png")
	})
})
