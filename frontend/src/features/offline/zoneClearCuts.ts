import { uniqBy } from "es-toolkit"
import type { KyInstance } from "ky"
import z from "zod"

import {
	type ClearCutReportResponse,
	clearCutReportResponseSchema,
	clearCutsResponseSchema
} from "@/features/clear-cut/store/clear-cuts"
import type { Bounds } from "@/features/clear-cut/store/types"
import {
	listOfflineZones,
	OFFLINE_TILES_CACHE,
	type OfflineZone,
	saveOfflineZone,
	type TileStore,
	zoneClearCutsKey
} from "@/features/offline/tiles/offlineZones"
import type { GeoBounds } from "@/features/offline/tiles/tileMath"
import { createAppAsyncThunk } from "@/shared/store/thunk"

/** The map API returns at most this many reports per request. */
const MAP_PREVIEWS_LIMIT = 30
/** A zone is split in four at most this many times to get all its reports. */
const MAX_SPLITS = 3

function quarters({ south, west, north, east }: GeoBounds): GeoBounds[] {
	const lat = (south + north) / 2
	const lng = (west + east) / 2
	return [
		{ south, west, north: lat, east: lng },
		{ south, west: lng, north: lat, east },
		{ south: lat, west, north, east: lng },
		{ south: lat, west: lng, north, east }
	]
}

type RawReport = { id: string; raw: unknown }

/**
 * The reports of the map in these bounds, as the API sends them. Bounds that
 * hit the API limit are split, so that a busy zone loses none.
 */
export async function fetchReportsIn(
	api: KyInstance,
	bounds: GeoBounds,
	depth = 0
): Promise<RawReport[]> {
	const searchParams = new URLSearchParams({
		swLat: String(bounds.south),
		swLng: String(bounds.west),
		neLat: String(bounds.north),
		neLng: String(bounds.east)
	})
	const raw = await api
		.get("api/v1/clear-cuts-map/", { searchParams })
		.json<{ previews: unknown[] }>()
	const { previews } = clearCutsResponseSchema.parse(raw)
	if (previews.length >= MAP_PREVIEWS_LIMIT && depth < MAX_SPLITS) {
		const parts: RawReport[] = []
		for (const part of quarters(bounds)) {
			parts.push(...(await fetchReportsIn(api, part, depth + 1)))
		}
		return uniqBy(parts, ({ id }) => id)
	}
	return previews.map(({ id }, index) => ({ id, raw: raw.previews[index] }))
}

const openStore = (): Promise<TileStore | undefined> =>
	typeof caches === "undefined"
		? Promise.resolve(undefined)
		: caches.open(OFFLINE_TILES_CACHE).catch(() => undefined)

/** Stores the reports of the zone for use without network; returns their count. */
export const downloadZoneClearCutsThunk = createAppAsyncThunk<
	number,
	OfflineZone
>("downloadZoneClearCuts", async (zone, { extra: { api } }) => {
	const reports = await fetchReportsIn(api(), zone.bounds)
	const store = await openStore()
	if (!store) throw new Error("Cache API unavailable")
	await store.put(
		zoneClearCutsKey(zone.id),
		new Response(JSON.stringify(reports.map(({ raw }) => raw)), {
			headers: { "content-type": "application/json" }
		})
	)
	saveOfflineZone({ ...zone, clearCuts: reports.length })
	return reports.length
})

const overlaps = (zone: OfflineZone, bounds?: Bounds) =>
	!bounds ||
	(zone.bounds.south <= bounds.ne.lat &&
		zone.bounds.north >= bounds.sw.lat &&
		zone.bounds.west <= bounds.ne.lng &&
		zone.bounds.east >= bounds.sw.lng)

/** The reports stored with the downloaded zones that overlap the bounds. */
export async function readZoneClearCuts(
	bounds?: Bounds
): Promise<ClearCutReportResponse[]> {
	const store = await openStore()
	if (!store) return []
	const reports: ClearCutReportResponse[] = []
	for (const zone of listOfflineZones()) {
		if (zone.clearCuts === undefined || !overlaps(zone, bounds)) continue
		const response = await store.match(zoneClearCutsKey(zone.id))
		const parsed = z
			.array(clearCutReportResponseSchema)
			.safeParse(await response?.json().catch(() => undefined))
		// Stored by an older version of the application: skipped
		if (parsed.success) reports.push(...parsed.data)
	}
	return uniqBy(reports, ({ id }) => id)
}
