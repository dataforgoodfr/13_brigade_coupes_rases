import z from "zod"

import {
	CADASTRE_URL,
	PHOTOS_IGN_URL,
	PLAN_IGN_URL,
	tileUrl
} from "@/shared/geoplateforme"
import { localStorageRepository } from "@/shared/localStorage"

import { countTiles, type GeoBounds, tilesInBounds } from "./tileMath"

/**
 * Downloaded tiles live in their own cache, apart from the service worker
 * cache of viewed tiles, whose expiration would purge them.
 */
export const OFFLINE_TILES_CACHE = "offline-zones-v1"

/** About 1 m per pixel: enough to find one's way in a forest plot. */
export const MAX_OFFLINE_ZOOM = 17

/** Per zone, all layers included: about 6 minutes of download. */
export const MAX_ZONE_TILES = 3000

/** The Géoplateforme allows 10 to 50 requests per second and per address. */
const REQUESTS_PER_SECOND = 8
const CONCURRENT_REQUESTS = 4
/** Consecutive network failures after which the network is deemed lost. */
const MAX_CONSECUTIVE_FAILURES = 8

/** Only the IGN layers may be downloaded (open licence). */
export const OFFLINE_SOURCES = {
	"plan-ign": {
		label: "Plan IGN",
		template: PLAN_IGN_URL,
		// Measured on forest areas: 11 to 26 kB
		averageTileBytes: 20_000
	},
	"photos-ign": {
		label: "Photos IGN",
		template: PHOTOS_IGN_URL,
		averageTileBytes: 20_000
	},
	cadastre: {
		label: "Cadastre",
		template: CADASTRE_URL,
		averageTileBytes: 12_000
	}
} as const

export type OfflineSourceId = keyof typeof OFFLINE_SOURCES
const sourceIds = Object.keys(OFFLINE_SOURCES) as [
	OfflineSourceId,
	...OfflineSourceId[]
]

const offlineZoneSchema = z.object({
	id: z.string(),
	name: z.string(),
	createdAt: z.string(),
	bounds: z.object({
		south: z.number(),
		west: z.number(),
		north: z.number(),
		east: z.number()
	}),
	minZoom: z.number().int(),
	maxZoom: z.number().int(),
	sources: z.array(z.enum(sourceIds)).min(1),
	/** All layers included. */
	tileCount: z.number().int(),
	storedTiles: z.number().int(),
	storedBytes: z.number(),
	complete: z.boolean()
})
export type OfflineZone = z.infer<typeof offlineZoneSchema>

const zonesRepository = localStorageRepository<OfflineZone>("offlineZones")

export const listOfflineZones = (): OfflineZone[] =>
	zonesRepository
		.getValuesFromStorage(offlineZoneSchema)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export const saveOfflineZone = (zone: OfflineZone) =>
	zonesRepository.setToLocalStorageById(zone.id, zone)

export type ZonePlan = {
	zone: OfflineZone
	estimatedBytes: number
	tooLarge: boolean
}

/** The zone shown on screen, from the current zoom down to the street level. */
export function planOfflineZone({
	name,
	bounds,
	zoom,
	sources
}: {
	name: string
	bounds: GeoBounds
	zoom: number
	sources: OfflineSourceId[]
}): ZonePlan {
	const maxZoom = MAX_OFFLINE_ZOOM
	const minZoom = Math.min(Math.floor(zoom), maxZoom)
	const positions = countTiles(bounds, minZoom, maxZoom)
	const tileCount = positions * sources.length
	const estimatedBytes = sources.reduce(
		(total, source) =>
			total + positions * OFFLINE_SOURCES[source].averageTileBytes,
		0
	)
	return {
		zone: {
			id: crypto.randomUUID(),
			name,
			createdAt: new Date().toISOString(),
			bounds,
			minZoom,
			maxZoom,
			sources,
			tileCount,
			storedTiles: 0,
			storedBytes: 0,
			complete: false
		},
		estimatedBytes,
		tooLarge: tileCount > MAX_ZONE_TILES
	}
}

export function* zoneTileUrls(zone: OfflineZone): Generator<string> {
	for (const source of zone.sources) {
		const { template } = OFFLINE_SOURCES[source]
		for (const tile of tilesInBounds(zone.bounds, zone.minZoom, zone.maxZoom)) {
			yield tileUrl(template, tile)
		}
	}
}

export type TileStore = Pick<Cache, "match" | "put" | "delete">

export type OfflineDependencies = {
	openStore: () => Promise<TileStore>
	fetchTile: (url: string, signal?: AbortSignal) => Promise<Response>
	/** Waits before each request, to stay under the rate limit. */
	sleep: (ms: number) => Promise<void>
}

const defaultDependencies: OfflineDependencies = {
	openStore: () => caches.open(OFFLINE_TILES_CACHE),
	// "no-store": the service worker leaves these requests alone, so the
	// tiles are not stored twice
	fetchTile: (url, signal) => fetch(url, { cache: "no-store", signal }),
	sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}

/** Free space is checked before downloading, with a 20 % margin. */
export async function hasRoomFor(bytes: number): Promise<boolean> {
	const estimate = await navigator.storage?.estimate?.()
	if (!estimate?.quota) return true
	return estimate.quota - (estimate.usage ?? 0) > bytes * 1.2
}

export type DownloadProgress = { done: number; total: number }

export type DownloadResult = {
	zone: OfflineZone
	failedTiles: number
	/** Why the download stopped before the end, if it did. */
	interruption?: "network" | "storage" | "cancelled"
}

const storedSize = (response: Response) =>
	Number(response.headers.get("content-length") ?? 0)

/**
 * Downloads the tiles of the zone that are not stored yet: running it again
 * on an incomplete zone resumes it. Tiles already received are kept when the
 * network is lost, the storage is full or the user cancels.
 */
export async function downloadOfflineZone(
	zone: OfflineZone,
	{
		onProgress,
		signal
	}: {
		onProgress?: (progress: DownloadProgress) => void
		signal?: AbortSignal
	} = {},
	dependencies: OfflineDependencies = defaultDependencies
): Promise<DownloadResult> {
	const { openStore, fetchTile, sleep } = dependencies
	const store = await openStore()
	const urls = zoneTileUrls(zone)
	const total = zone.tileCount
	let done = 0
	let storedTiles = 0
	let storedBytes = 0
	let failedTiles = 0
	let consecutiveFailures = 0
	let interruption: DownloadResult["interruption"]
	const interval = 1000 / REQUESTS_PER_SECOND
	let nextSlot = Date.now()

	const stopped = () => {
		if (signal?.aborted) interruption ??= "cancelled"
		return interruption !== undefined
	}

	const handle = async (url: string) => {
		const cached = await store.match(url)
		if (cached) {
			storedTiles++
			storedBytes += storedSize(cached)
			return
		}
		const now = Date.now()
		const wait = Math.max(0, nextSlot - now)
		nextSlot = Math.max(now, nextSlot) + interval
		if (wait > 0) await sleep(wait)
		if (stopped()) return
		let response: Response
		try {
			response = await fetchTile(url, signal)
		} catch {
			failedTiles++
			if (++consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
				interruption ??= "network"
			}
			return
		}
		consecutiveFailures = 0
		const contentType = response.headers.get("content-type") ?? ""
		if (!response.ok || !contentType.startsWith("image/")) {
			failedTiles++
			return
		}
		const blob = await response.blob()
		try {
			await store.put(
				url,
				new Response(blob, {
					headers: {
						"content-type": contentType,
						"content-length": String(blob.size)
					}
				})
			)
			storedTiles++
			storedBytes += blob.size
		} catch {
			failedTiles++
			interruption ??= "storage"
		}
	}

	const worker = async () => {
		for (let next = urls.next(); !next.done; next = urls.next()) {
			if (stopped()) return
			await handle(next.value)
			done++
			onProgress?.({ done, total })
		}
	}

	try {
		await Promise.all(Array.from({ length: CONCURRENT_REQUESTS }, worker))
	} finally {
		zone = {
			...zone,
			storedTiles,
			storedBytes,
			complete: storedTiles === total
		}
		saveOfflineZone(zone)
	}
	stopped()
	return { zone, failedTiles, interruption }
}

/** A tile shared with another zone is only deleted with the last one. */
export async function deleteOfflineZone(
	zoneId: string,
	dependencies: Pick<OfflineDependencies, "openStore"> = defaultDependencies
) {
	const zones = listOfflineZones()
	const zone = zones.find(({ id }) => id === zoneId)
	if (zone) {
		const kept = new Set<string>()
		for (const other of zones) {
			if (other.id === zoneId) continue
			for (const url of zoneTileUrls(other)) kept.add(url)
		}
		const store = await dependencies.openStore()
		for (const url of zoneTileUrls(zone)) {
			if (!kept.has(url)) await store.delete(url)
		}
	}
	zonesRepository.setToLocalStorageById(zoneId, undefined)
}
