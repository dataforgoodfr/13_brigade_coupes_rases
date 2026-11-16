import { beforeEach, describe, expect, it } from "vitest"

import {
	deleteOfflineZone,
	downloadOfflineZone,
	listOfflineZones,
	MAX_OFFLINE_ZOOM,
	type OfflineDependencies,
	type OfflineZone,
	planOfflineZone,
	type TileStore,
	zoneTileUrls
} from "@/features/offline/tiles/offlineZones"
import {
	countTiles,
	latToTileY,
	lngToTileX,
	tilesInBounds
} from "@/features/offline/tiles/tileMath"

// About 2 km around a clear cut in the Landes: 143 tiles from zoom 15
const SMALL = { south: 44.19, west: -0.92, north: 44.21, east: -0.9 }

/** In-memory stand-in for the Cache API. */
function memoryStore() {
	const entries = new Map<string, Response>()
	const store: TileStore = {
		match: async (request) => entries.get(String(request))?.clone(),
		put: async (request, response) => {
			entries.set(String(request), response)
		},
		delete: async (request) => entries.delete(String(request))
	}
	return { entries, store }
}

const png = () =>
	new Response(new Blob([new Uint8Array(100)]), {
		headers: { "content-type": "image/png" }
	})

function dependencies(
	store: TileStore,
	fetchTile: OfflineDependencies["fetchTile"] = async () => png()
): OfflineDependencies & { requested: string[] } {
	const requested: string[] = []
	return {
		requested,
		openStore: async () => store,
		fetchTile: (url, signal) => {
			requested.push(url)
			return fetchTile(url, signal)
		},
		sleep: async () => undefined
	}
}

const plan = (sources: OfflineZone["sources"] = ["plan-ign"]) =>
	planOfflineZone({ name: "Sabres", bounds: SMALL, zoom: 15, sources }).zone

describe("tile math", () => {
	it("finds the tile of a point", () => {
		// Paris, checked against the Géoplateforme tile grid
		expect(lngToTileX(2.3522, 12)).toBe(2074)
		expect(latToTileY(48.8566, 12)).toBe(1409)
		expect(lngToTileX(-180, 3)).toBe(0)
		expect(lngToTileX(180, 3)).toBe(7)
	})

	it("counts and lists the same tiles", () => {
		const count = countTiles(SMALL, 15, MAX_OFFLINE_ZOOM)
		const tiles = [...tilesInBounds(SMALL, 15, MAX_OFFLINE_ZOOM)]
		expect(tiles).toHaveLength(count)
		expect(new Set(tiles.map(({ x, y, z }) => `${z}/${x}/${y}`)).size).toBe(
			count
		)
		expect(tiles.every(({ z }) => z >= 15 && z <= MAX_OFFLINE_ZOOM)).toBe(true)
	})
})

describe("planOfflineZone", () => {
	it("goes from the current zoom to the maximum zoom", () => {
		const { zone, estimatedBytes, tooLarge } = planOfflineZone({
			name: "Sabres",
			bounds: SMALL,
			zoom: 15.6,
			sources: ["plan-ign", "photos-ign"]
		})
		const positions = countTiles(SMALL, 15, MAX_OFFLINE_ZOOM)
		expect(zone.minZoom).toBe(15)
		expect(zone.maxZoom).toBe(MAX_OFFLINE_ZOOM)
		expect(zone.tileCount).toBe(positions * 2)
		expect(estimatedBytes).toBe(positions * 40_000)
		expect(tooLarge).toBe(false)
	})

	it("refuses a zone too large", () => {
		const department = { south: 43.5, west: -1.5, north: 44.5, east: 0 }
		expect(
			planOfflineZone({
				name: "Landes",
				bounds: department,
				zoom: 9,
				sources: ["plan-ign"]
			}).tooLarge
		).toBe(true)
	})

	it("downloads only the maximum zoom when zoomed in further", () => {
		const { zone } = planOfflineZone({
			name: "Sabres",
			bounds: SMALL,
			zoom: 19,
			sources: ["plan-ign"]
		})
		expect(zone.minZoom).toBe(MAX_OFFLINE_ZOOM)
	})
})

describe("downloadOfflineZone", () => {
	beforeEach(() => localStorage.clear())

	it("stores every tile of the zone and saves it as complete", async () => {
		const { entries, store } = memoryStore()
		const zone = plan(["plan-ign", "cadastre"])
		const progress: number[] = []
		const result = await downloadOfflineZone(
			zone,
			{ onProgress: ({ done }) => progress.push(done) },
			dependencies(store)
		)
		expect(entries.size).toBe(zone.tileCount)
		expect(result.zone).toMatchObject({
			complete: true,
			storedTiles: zone.tileCount,
			storedBytes: zone.tileCount * 100
		})
		expect(result.interruption).toBeUndefined()
		expect(progress.at(-1)).toBe(zone.tileCount)
		expect(listOfflineZones()).toEqual([result.zone])
	})

	it("keeps the tiles received when the network is lost, then resumes", async () => {
		const { entries, store } = memoryStore()
		const zone = plan()
		let calls = 0
		const first = await downloadOfflineZone(
			zone,
			{},
			dependencies(store, async () => {
				if (++calls > 10) throw new TypeError("Failed to fetch")
				return png()
			})
		)
		expect(first.interruption).toBe("network")
		expect(first.zone.complete).toBe(false)
		expect(first.zone.storedTiles).toBe(10)
		expect(entries.size).toBe(10)

		const resumed = dependencies(store)
		const second = await downloadOfflineZone(first.zone, {}, resumed)
		expect(second.zone.complete).toBe(true)
		// Only the missing tiles are requested again
		expect(resumed.requested).toHaveLength(zone.tileCount - 10)
	})

	it("does not store an error returned instead of a tile", async () => {
		const { entries, store } = memoryStore()
		const zone = plan()
		const result = await downloadOfflineZone(
			zone,
			{},
			dependencies(
				store,
				async () =>
					new Response("<ExceptionReport/>", {
						status: 400,
						headers: { "content-type": "application/xml" }
					})
			)
		)
		expect(entries.size).toBe(0)
		expect(result.failedTiles).toBe(zone.tileCount)
		expect(result.zone.complete).toBe(false)
	})

	it("stops when the storage is full", async () => {
		const { store } = memoryStore()
		const full: TileStore = {
			...store,
			put: async () => {
				throw new DOMException("full", "QuotaExceededError")
			}
		}
		const result = await downloadOfflineZone(plan(), {}, dependencies(full))
		expect(result.interruption).toBe("storage")
	})

	it("stops when cancelled", async () => {
		const { entries, store } = memoryStore()
		const controller = new AbortController()
		const zone = plan()
		const result = await downloadOfflineZone(
			zone,
			{
				signal: controller.signal,
				onProgress: ({ done }) => {
					if (done === 5) controller.abort()
				}
			},
			dependencies(store)
		)
		expect(result.interruption).toBe("cancelled")
		expect(entries.size).toBeLessThan(zone.tileCount)
		expect(listOfflineZones()[0]?.complete).toBe(false)
	})
})

describe("deleteOfflineZone", () => {
	beforeEach(() => localStorage.clear())

	it("keeps the tiles still used by another zone", async () => {
		const { entries, store } = memoryStore()
		const deps = dependencies(store)
		const first = (await downloadOfflineZone(plan(), {}, deps)).zone
		const overlapping = planOfflineZone({
			name: "Sabres nord",
			bounds: { ...SMALL, south: 44.2, north: 44.22 },
			zoom: 15,
			sources: ["plan-ign"]
		}).zone
		const second = (await downloadOfflineZone(overlapping, {}, deps)).zone

		await deleteOfflineZone(first.id, deps)

		expect(listOfflineZones().map(({ id }) => id)).toEqual([second.id])
		const kept = new Set(zoneTileUrls(second))
		expect([...entries.keys()].every((url) => kept.has(url))).toBe(true)
		expect(entries.size).toBe(kept.size)

		await deleteOfflineZone(second.id, deps)
		expect(entries.size).toBe(0)
		expect(listOfflineZones()).toEqual([])
	})
})
