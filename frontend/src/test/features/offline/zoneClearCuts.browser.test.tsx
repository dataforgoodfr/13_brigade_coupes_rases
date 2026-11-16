import { HttpResponse, http } from "msw"
import { afterEach, describe, expect, it } from "vitest"

import {
	getClearCutsThunk,
	selectClearCuts,
	selectDetail,
	storeClearCutFormThunk
} from "@/features/clear-cut/store/clear-cuts-slice"
import {
	listOfflineZones,
	OFFLINE_TILES_CACHE,
	planOfflineZone,
	saveOfflineZone
} from "@/features/offline/tiles/offlineZones"
import { downloadZoneClearCutsThunk } from "@/features/offline/zoneClearCuts"
import { initialState } from "@/features/user/store/me.slice"
import { worker } from "@/mocks/browser"
import {
	createClearCutReportResponseBaseMock,
	mockClearCutReportResponse
} from "@/mocks/clear-cuts"
import { mockClearCutFormsResponse } from "@/mocks/clear-cuts-forms"
import { getReferentialThunk } from "@/shared/store/referential/referential.slice"
import { setupStore } from "@/shared/store/store"
import { volunteerMock } from "@/test/mocks/user"

const ZONE = { south: 44.1, west: -0.8, north: 44.2, east: -0.7 }

const report = (id: string, lat: number, lng: number) =>
	createClearCutReportResponseBaseMock({
		id,
		// The first report of the zone is assigned to the volunteer
		userId: id === "zone-0" ? volunteerMock.id : null,
		averageLocation: { type: "Point", coordinates: [lng, lat] }
	})

/** 40 reports spread over the zone: more than one request returns. */
const REPORTS = Array.from({ length: 40 }, (_, i) =>
	report(
		`zone-${i}`,
		ZONE.south + 0.0025 * (i % 40) + 0.001,
		ZONE.west + 0.0024 * ((i * 7) % 40) + 0.001
	)
)

/** The map API: reports within the bounds, 30 at most. */
function mockMapApi() {
	const requests: URLSearchParams[] = []
	worker.use(
		http.get("*/api/v1/clear-cuts-map", ({ request }) => {
			const params = new URL(request.url).searchParams
			requests.push(params)
			const [swLat, swLng, neLat, neLng] = [
				"swLat",
				"swLng",
				"neLat",
				"neLng"
			].map((key) => Number(params.get(key)))
			const inside = REPORTS.filter(({ averageLocation }) => {
				const [lng, lat] = averageLocation.coordinates
				return lat >= swLat && lat <= neLat && lng >= swLng && lng <= neLng
			})
			return HttpResponse.json({
				previews: inside.slice(0, 30),
				points: { total: inside.length, content: [] }
			})
		})
	)
	return requests
}

const downloadedZone = () => {
	const { zone } = planOfflineZone({
		name: "Sabres",
		bounds: ZONE,
		zoom: 13,
		sources: ["plan-ign"]
	})
	saveOfflineZone(zone)
	return zone
}

describe("clear cuts of an offline zone", () => {
	afterEach(() => caches.delete(OFFLINE_TILES_CACHE))

	it("stores every report of a busy zone", async () => {
		const requests = mockMapApi()
		const store = setupStore()
		const zone = downloadedZone()

		const { count } = await store
			.dispatch(downloadZoneClearCutsThunk(zone))
			.unwrap()

		expect(count).toBe(REPORTS.length)
		// The first request hit the limit: the zone was split
		expect(requests.length).toBeGreaterThan(1)
		expect(listOfflineZones()[0].clearCuts).toBe(REPORTS.length)
	})

	it("shows them on the map without network", async () => {
		mockMapApi()
		const store = setupStore()
		await store.dispatch(downloadZoneClearCutsThunk(downloadedZone())).unwrap()

		worker.use(http.get("*/api/v1/clear-cuts-map", () => HttpResponse.error()))
		await store.dispatch(
			getClearCutsThunk({
				cutYears: [],
				cutMonths: [],
				geoBounds: {
					sw: { lat: 44.15, lng: -0.75 },
					ne: { lat: 44.3, lng: -0.6 }
				}
			})
		)

		const ids = selectClearCuts(store.getState()).value?.previews.map(
			({ id }) => id
		)
		expect(ids).toHaveLength(REPORTS.length)
		expect(ids).toContain("zone-0")
	})

	it("ignores the zones away from the map", async () => {
		mockMapApi()
		const store = setupStore()
		await store.dispatch(downloadZoneClearCutsThunk(downloadedZone())).unwrap()

		worker.use(http.get("*/api/v1/clear-cuts-map", () => HttpResponse.error()))
		await store.dispatch(
			getClearCutsThunk({
				cutYears: [],
				cutMonths: [],
				geoBounds: { sw: { lat: 48, lng: 2 }, ne: { lat: 48.1, lng: 2.1 } }
			})
		)

		expect(selectClearCuts(store.getState()).value?.previews).toEqual([])
	})

	it("names the reports of the user, whose forms are then stored", async () => {
		mockMapApi()
		const store = setupStore({
			me: { ...initialState, me: { status: "success", value: volunteerMock } }
		})
		await store.dispatch(getReferentialThunk())
		const { count, ownReportIds } = await store
			.dispatch(downloadZoneClearCutsThunk(downloadedZone()))
			.unwrap()
		expect(count).toBe(REPORTS.length)
		expect(ownReportIds).toEqual(["zone-0"])

		worker.use(
			mockClearCutReportResponse({ id: "zone-0" }).handler,
			mockClearCutFormsResponse().handler
		)
		await store.dispatch(storeClearCutFormThunk({ id: "zone-0" })).unwrap()

		const stored = JSON.parse(localStorage.getItem("clear-cut-form") ?? "{}")
		expect(Object.keys(stored)).toEqual(["zone-0"])
		// Stored in the background: the form shown is left alone
		expect(selectDetail(store.getState()).status).toBe("idle")
	})
})
