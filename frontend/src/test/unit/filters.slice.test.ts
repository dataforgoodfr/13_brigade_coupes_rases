import { beforeEach, describe, expect, it } from "vitest"

import {
	commitFilters,
	filtersSlice,
	getFiltersThunk,
	resetFilters,
	selectFiltersRequest,
	setGeoBounds,
	toggleCutYear
} from "@/features/clear-cut/store/filters.slice"
import { type AppStore, setupStore } from "@/shared/store/store"

const { setStatuses, setCutYears, setFavorite, setAreas } = filtersSlice.actions

const loaded = getFiltersThunk.fulfilled(
	{
		cutYears: [2024, 2025],
		departments: [{ id: "40", code: "40", name: "40 - Landes" }],
		rules: [],
		statuses: ["to_validate", "validated"],
		areaRange: { min: 0.5, max: 120 },
		excessiveSlope: undefined,
		hasEcologicalZonings: undefined,
		favorite: undefined
	},
	"request-id"
)

describe("filters slice", () => {
	let store: AppStore

	beforeEach(() => {
		store = setupStore()
		store.dispatch(loaded)
	})

	it("initialises pending and committed filters from the API once", () => {
		const state = store.getState().filters
		expect(state.isInitialized).toBe(true)
		expect(state.cutYears.map((y) => y.item)).toEqual([2024, 2025])
		expect(state.cutMonths).toHaveLength(12)
		expect(state.areas).toEqual([0.5, 120])
		expect(state.area_range).toEqual({ min: 0.5, max: 120 })
		expect(state.pendingFilters.statuses).toEqual(state.statuses)

		store.dispatch(setCutYears([{ isSelected: true, item: 2030 }]))
		store.dispatch(loaded)
		expect(store.getState().filters.pendingFilters.cutYears).toEqual([
			{ isSelected: true, item: 2030 }
		])
	})

	it("only applies pending changes to the request on commit", () => {
		store.dispatch(setStatuses([{ isSelected: true, item: "validated" }]))
		store.dispatch(setAreas([1, 10]))
		expect(selectFiltersRequest(store.getState())?.statuses).toEqual([])

		store.dispatch(commitFilters())
		const request = selectFiltersRequest(store.getState())
		expect(request?.statuses).toEqual(["validated"])
		expect(request?.minAreaHectare).toBe(1)
		expect(request?.maxAreaHectare).toBe(10)
	})

	it("reset clears every selection and bumps the version", () => {
		store.dispatch(setStatuses([{ isSelected: true, item: "validated" }]))
		store.dispatch(commitFilters())

		store.dispatch(resetFilters())
		const state = store.getState().filters
		expect(state.statuses.every((s) => !s.isSelected)).toBe(true)
		expect(state.pendingFilters.statuses.every((s) => !s.isSelected)).toBe(true)
		expect(state.areas).toEqual([0.5, 120])
		expect(state.resetVersion).toBe(1)
	})

	it("toggles a committed cut year directly", () => {
		store.dispatch(toggleCutYear({ isSelected: true, item: 2025 }))
		expect(selectFiltersRequest(store.getState())?.cutYears).toEqual([2025])
	})

	it("ignores degenerate map bounds", () => {
		const point = { lat: 44, lng: -1 }
		store.dispatch(setGeoBounds({ sw: point, ne: point }))
		expect(store.getState().filters.geoBounds).toBeUndefined()

		const bounds = { sw: point, ne: { lat: 45, lng: 0 } }
		store.dispatch(setGeoBounds(bounds))
		expect(selectFiltersRequest(store.getState())?.geoBounds).toEqual(bounds)
	})

	it("maps the favorite choice to inReportsIds / outReportsIds", () => {
		const request = () => selectFiltersRequest(store.getState())
		expect(request()?.inReportsIds).toBeUndefined()
		expect(request()?.outReportsIds).toBeUndefined()

		store.dispatch(setFavorite({ isSelected: true, item: true }))
		store.dispatch(commitFilters())
		expect(request()?.inReportsIds).toEqual([])
		expect(request()?.outReportsIds).toBeUndefined()

		store.dispatch(setFavorite({ isSelected: true, item: false }))
		store.dispatch(commitFilters())
		expect(request()?.inReportsIds).toBeUndefined()
		expect(request()?.outReportsIds).toEqual([])
	})
})
