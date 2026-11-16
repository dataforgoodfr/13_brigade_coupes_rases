import "leaflet/dist/leaflet.css"

import { screen } from "@testing-library/dom"
import type { Map as LeafletMap } from "leaflet"
import { HttpResponse, http } from "msw"
import { createRef } from "react"
import { MapContainer } from "react-leaflet"
import { Provider } from "react-redux"
import { afterEach, describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

import { OfflineZonesDialog } from "@/features/offline/components/OfflineZonesDialog"
import { OfflineTileLayer } from "@/features/offline/tiles/OfflineTileLayer"
import {
	listOfflineZones,
	MAX_OFFLINE_ZOOM,
	OFFLINE_TILES_CACHE
} from "@/features/offline/tiles/offlineZones"
import { worker } from "@/mocks/browser"
import { setupStore } from "@/shared/store/store"

const PNG = Uint8Array.from(
	atob(
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
	),
	(c) => c.charCodeAt(0)
)

function mockGeoplateforme() {
	worker.use(
		http.get(
			"https://data.geopf.fr/wmts",
			() => new HttpResponse(PNG, { headers: { "content-type": "image/png" } })
		),
		http.get("*/api/v1/clear-cuts-map", () =>
			HttpResponse.json({ previews: [], points: { total: 0, content: [] } })
		),
		http.get("https://data.geopf.fr/geocodage/reverse", () =>
			HttpResponse.json({
				features: [{ properties: { toponym: "Sabres" } }]
			})
		)
	)
}

const mapRef = createRef<LeafletMap>()

const renderDialog = (zoom: number) =>
	render(
		<Provider store={setupStore()}>
			<MapContainer
				ref={mapRef}
				center={{ lat: 44.15, lng: -0.74 }}
				zoom={zoom}
				zoomAnimation={false}
				style={{ height: 200, width: 200 }}
			>
				<OfflineZonesDialog open onOpenChange={() => undefined} />
			</MapContainer>
		</Provider>
	)

describe("OfflineZonesDialog", () => {
	afterEach(() => caches.delete(OFFLINE_TILES_CACHE))

	it("downloads the zone shown, lists it, then deletes it", async () => {
		mockGeoplateforme()
		await renderDialog(15)
		expect(screen.getByText(/tuiles, environ/)).toBeInTheDocument()
		await userEvent.click(
			screen.getByRole("button", { name: "Télécharger cette zone" })
		)
		expect(
			await screen.findByText(
				"« Sabres » est disponible hors ligne. 0 coupe enregistrée.",
				{},
				{
					timeout: 15_000
				}
			)
		).toBeInTheDocument()

		const [zone] = listOfflineZones()
		expect(zone).toMatchObject({
			name: "Sabres",
			complete: true,
			sources: ["plan-ign"],
			minZoom: 15,
			maxZoom: MAX_OFFLINE_ZOOM,
			clearCuts: 0
		})
		const cache = await caches.open(OFFLINE_TILES_CACHE)
		// The tiles, and the clear cuts of the zone
		expect(await cache.keys()).toHaveLength(zone.tileCount + 1)
		expect(screen.getByText("Zones téléchargées")).toBeInTheDocument()

		// Back on the zone, at a zoom that was downloaded
		mapRef.current?.setZoom(12)
		await userEvent.click(
			screen.getByRole("button", { name: "Voir Sabres sur la carte" })
		)
		expect(mapRef.current?.getZoom()).toBe(15)

		await userEvent.click(
			screen.getByRole("button", { name: "Supprimer Sabres" })
		)
		await expect.poll(() => listOfflineZones()).toEqual([])
		expect(await cache.keys()).toHaveLength(0)
		expect(screen.queryByText("Zones téléchargées")).not.toBeInTheDocument()
	}, 20_000)

	it("refuses a zone too large", async () => {
		await renderDialog(9)
		expect(screen.getByText(/Zone trop grande/)).toBeInTheDocument()
		expect(
			screen.getByRole("button", { name: "Télécharger cette zone" })
		).toBeDisabled()
	})
})

describe("OfflineTileLayer.limitToDownloadedZooms", () => {
	it("enlarges the deepest downloaded tiles without network", () => {
		const layer = new OfflineTileLayer("/{z}/{x}/{y}.png", {
			maxNativeZoom: 19
		})
		expect(layer.limitToDownloadedZooms(true)).toBe(true)
		expect(layer.options.maxNativeZoom).toBe(MAX_OFFLINE_ZOOM)
		expect(layer.limitToDownloadedZooms(true)).toBe(false)
		expect(layer.limitToDownloadedZooms(false)).toBe(true)
		expect(layer.options.maxNativeZoom).toBe(19)

		const cadastre = new OfflineTileLayer("/{z}/{x}/{y}.png")
		cadastre.limitToDownloadedZooms(true)
		expect(cadastre.options.maxNativeZoom).toBe(MAX_OFFLINE_ZOOM)
		cadastre.limitToDownloadedZooms(false)
		expect(cadastre.options.maxNativeZoom).toBeUndefined()
	})
})
