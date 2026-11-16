import * as L from "leaflet"

import { OFFLINE_TILES_CACHE } from "./offlineZones"

let offlineStore: Promise<Cache | undefined> | undefined

/** Undefined where the Cache API is missing (page not served over HTTPS). */
function openOfflineStore(): Promise<Cache | undefined> {
	offlineStore ??=
		typeof caches === "undefined"
			? Promise.resolve(undefined)
			: caches.open(OFFLINE_TILES_CACHE).catch(() => undefined)
	return offlineStore
}

export async function findOfflineTile(url: string): Promise<Blob | undefined> {
	const store = await openOfflineStore()
	const response = await store?.match(url).catch(() => undefined)
	return response?.blob()
}

type TileCallbacks = {
	_tileOnLoad: (done: L.DoneCallback, tile: HTMLImageElement) => void
	_tileOnError: (
		done: L.DoneCallback,
		tile: HTMLImageElement,
		error: Event
	) => void
}

/**
 * A tile layer that takes its tiles from the downloaded zones first, then
 * from the network.
 */
export class OfflineTileLayer extends L.TileLayer {
	override createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
		const tile = document.createElement("img")
		const callbacks = this as unknown as TileCallbacks
		L.DomEvent.on(tile, "load", () => {
			if (tile.src.startsWith("blob:")) URL.revokeObjectURL(tile.src)
			callbacks._tileOnLoad.call(this, done, tile)
		})
		L.DomEvent.on(tile, "error", (error) => {
			callbacks._tileOnError.call(this, done, tile, error)
		})
		tile.alt = ""
		const url = this.getTileUrl(coords)
		findOfflineTile(url)
			.catch(() => undefined)
			.then((blob) => {
				// Leaflet gives a blank source to the tiles it drops meanwhile
				if (tile.getAttribute("src") !== null) return
				tile.src = blob ? URL.createObjectURL(blob) : url
			})
		return tile
	}
}

export const offlineTileLayer = (url: string, options?: L.TileLayerOptions) =>
	new OfflineTileLayer(url, options)
