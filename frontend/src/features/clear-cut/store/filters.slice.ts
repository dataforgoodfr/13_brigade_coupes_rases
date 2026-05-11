import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { ClearCutStatus } from "@/features/clear-cut/store/clear-cuts"
import {
	type FiltersRequest,
	type FiltersResponse,
	filtersResponseSchema
} from "@/features/clear-cut/store/filters"
import type { Bounds } from "@/features/clear-cut/store/types"
import { selectFavorites } from "@/features/user/store/me.slice"
import {
	booleanToSelectableItem,
	DEFAULT_EVENTUALLY_BOOLEAN,
	type EventuallyBooleanSelectableItems,
	listToSelectableItems,
	type NamedId,
	type SelectableItem,
	updateEventuallyBooleanSelectableItem
} from "@/shared/items"
import type { Department, Rule } from "@/shared/store/referential/referential"
import {
	selectDepartmentsByIds,
	selectRulesByIds
} from "@/shared/store/referential/referential.slice"
import { createTypedDraftSafeSelector } from "@/shared/store/selector"
import type { RootState } from "@/shared/store/store"
import { createAppAsyncThunk } from "@/shared/store/thunk"
import type { Range } from "@/shared/types/range"
interface PendingFilters {
	cutYears: SelectableItem<number>[]
	cutMonths: SelectableItem<number>[]
	departments: SelectableItem<Department>[]
	statuses: SelectableItem<ClearCutStatus>[]
	areas?: [number, number]
	excessive_slope: EventuallyBooleanSelectableItems
	ecological_zoning: EventuallyBooleanSelectableItems
	favorite: EventuallyBooleanSelectableItems
}

export interface FiltersState {
	rules: SelectableItem<Rule>[]
	// committed (applied to map, updated only on OK)
	cutYears: SelectableItem<number>[]
	cutMonths: SelectableItem<number>[]
	geoBounds?: Bounds
	area_range: Range
	departments: SelectableItem<Department>[]
	statuses: SelectableItem<ClearCutStatus>[]
	areas?: [number, number]
	excessive_slope: EventuallyBooleanSelectableItems
	ecological_zoning: EventuallyBooleanSelectableItems
	favorite: EventuallyBooleanSelectableItems
	with_points?: boolean
	// pending (UI editing state, not yet applied)
	isInitialized: boolean
	resetVersion: number
	pendingFilters: PendingFilters
}

const emptyPending: PendingFilters = {
	cutYears: [],
	cutMonths: [],
	departments: [],
	statuses: [],
	excessive_slope: DEFAULT_EVENTUALLY_BOOLEAN,
	ecological_zoning: DEFAULT_EVENTUALLY_BOOLEAN,
	favorite: DEFAULT_EVENTUALLY_BOOLEAN
}

export const initialState: FiltersState = {
	cutYears: [],
	cutMonths: [],
	rules: [],
	departments: [],
	area_range: { min: 0, max: 0 },
	statuses: [],
	excessive_slope: DEFAULT_EVENTUALLY_BOOLEAN,
	ecological_zoning: DEFAULT_EVENTUALLY_BOOLEAN,
	favorite: DEFAULT_EVENTUALLY_BOOLEAN,
	isInitialized: false,
	resetVersion: 0,
	pendingFilters: emptyPending
}

export const getFiltersThunk = createAppAsyncThunk(
	"filters/get",
	async (_arg, { getState, extra: { api } }) => {
		const result = await api().get<FiltersResponse>("api/v1/filters/").json()
		const {
			departmentsIds: departments_ids,
			rulesIds: tags_ids,
			...response
		} = filtersResponseSchema.parse(result)
		const state = getState()

		const departments = selectDepartmentsByIds(state, departments_ids)
			.map((d) => ({
				...d,
				id: d.id,
				name: `${d.code} - ${d.name}`
			}))
			.sort((a, b) => a.name.localeCompare(b.name))

		return {
			...response,
			departments,
			rules: selectRulesByIds(state, tags_ids ?? [])
		}
	}
)

export const filtersSlice = createSlice({
	initialState,
	name: "filters",
	reducers: {
		updateCutYear: (
			state,
			{ payload }: PayloadAction<SelectableItem<number>>
		) => {
			state.cutYears = state.cutYears.map((y) =>
				y.item === payload.item ? payload : y
			)
		},
		setCutYears: (
			state,
			{ payload }: PayloadAction<SelectableItem<number>[]>
		) => {
			state.pendingFilters.cutYears = payload
		},
		setCutMonths: (
			state,
			{ payload }: PayloadAction<SelectableItem<number>[]>
		) => {
			state.pendingFilters.cutMonths = payload
		},
		setAreas: (
			state,
			{ payload }: PayloadAction<[number, number] | undefined>
		) => {
			state.pendingFilters.areas = payload
		},
		updateDepartment: (
			state,
			{ payload }: PayloadAction<SelectableItem<NamedId & { code: string }>>
		) => {
			state.pendingFilters.departments = state.pendingFilters.departments.map(
				(d) => (d.item.id === payload.item.id ? payload : d)
			)
		},
		setDepartments: (
			state,
			{ payload }: PayloadAction<SelectableItem<NamedId & { code: string }>[]>
		) => {
			state.pendingFilters.departments = payload
		},
		setStatuses: (
			state,
			{ payload }: PayloadAction<SelectableItem<ClearCutStatus>[]>
		) => {
			state.pendingFilters.statuses = payload
		},
		commitFilters: (state) => {
			state.cutYears = state.pendingFilters.cutYears
			state.cutMonths = state.pendingFilters.cutMonths
			state.departments = state.pendingFilters.departments
			state.statuses = state.pendingFilters.statuses
			state.areas = state.pendingFilters.areas
			state.excessive_slope = state.pendingFilters.excessive_slope
			state.ecological_zoning = state.pendingFilters.ecological_zoning
			state.favorite = state.pendingFilters.favorite
		},
		resetFilters: (state) => {
			const cleared = {
				cutYears: state.cutYears.map((y) => ({ ...y, isSelected: false })),
				cutMonths: state.cutMonths.map((m) => ({ ...m, isSelected: false })),
				departments: state.departments.map((d) => ({ ...d, isSelected: false })),
				statuses: state.statuses.map((s) => ({ ...s, isSelected: false })),
				areas: [state.area_range.min, state.area_range.max] as [number, number],
				excessive_slope: DEFAULT_EVENTUALLY_BOOLEAN.map((x) => ({
					...x
				})) as typeof DEFAULT_EVENTUALLY_BOOLEAN,
				ecological_zoning: DEFAULT_EVENTUALLY_BOOLEAN.map((x) => ({
					...x
				})) as typeof DEFAULT_EVENTUALLY_BOOLEAN,
				favorite: DEFAULT_EVENTUALLY_BOOLEAN.map((x) => ({
					...x
				})) as typeof DEFAULT_EVENTUALLY_BOOLEAN
			}
			state.pendingFilters = cleared
			state.cutYears = cleared.cutYears
			state.cutMonths = cleared.cutMonths
			state.departments = cleared.departments
			state.statuses = cleared.statuses
			state.areas = cleared.areas
			state.excessive_slope = cleared.excessive_slope
			state.ecological_zoning = cleared.ecological_zoning
			state.favorite = cleared.favorite
			state.resetVersion += 1
		},
		setGeoBounds: (state, { payload }: PayloadAction<Bounds>) => {
			if (
				payload.ne.lat === payload.sw.lat &&
				payload.ne.lng === payload.sw.lng
			) {
				state.geoBounds = undefined
			} else {
				state.geoBounds = payload
			}
		},
		setHasEcologicalZoning: (
			state,
			{ payload }: PayloadAction<SelectableItem<boolean | undefined>>
		) => {
			state.pendingFilters.ecological_zoning =
				updateEventuallyBooleanSelectableItem(
					payload,
					state.pendingFilters.ecological_zoning
				)
		},
		setExcessiveSlop: (
			state,
			{ payload }: PayloadAction<SelectableItem<boolean | undefined>>
		) => {
			state.pendingFilters.excessive_slope =
				updateEventuallyBooleanSelectableItem(
					payload,
					state.pendingFilters.excessive_slope
				)
		},
		setFavorite: (
			state,
			{ payload }: PayloadAction<SelectableItem<boolean | undefined>>
		) => {
			state.pendingFilters.favorite = updateEventuallyBooleanSelectableItem(
				payload,
				state.pendingFilters.favorite
			)
		},
		setWithPoints: (state, { payload }: PayloadAction<boolean>) => {
			state.with_points = payload
		}
	},
	extraReducers: (builder) => {
		builder.addCase(
			getFiltersThunk.fulfilled,
			(
				state,
				{
					payload: {
						cutYears,
						rules,
						departments,
						areaRange: area_range,
						statuses,
						excessiveSlope: excessive_slope,
						hasEcologicalZonings: ecological_zoning,
						favorite
					}
				}
			) => {
				if (state.isInitialized) return
				state.isInitialized = true
				const initial: PendingFilters = {
					cutYears: listToSelectableItems(cutYears),
					cutMonths: listToSelectableItems([
						1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
					]),
					ecological_zoning: booleanToSelectableItem(ecological_zoning),
					excessive_slope: booleanToSelectableItem(excessive_slope),
					favorite: booleanToSelectableItem(favorite),
					departments: listToSelectableItems(departments),
					statuses: listToSelectableItems(statuses),
					areas: [area_range.min, area_range.max]
				}
				state.pendingFilters = initial
				state.cutYears = initial.cutYears
				state.cutMonths = initial.cutMonths
				state.ecological_zoning = initial.ecological_zoning
				state.excessive_slope = initial.excessive_slope
				state.favorite = initial.favorite
				state.departments = initial.departments
				state.statuses = initial.statuses
				state.areas = initial.areas
				state.rules = listToSelectableItems(rules)
				state.area_range = area_range
			}
		)
	}
})

export const {
	actions: {
		updateCutYear: toggleCutYear,
		setGeoBounds,
		setWithPoints,
		commitFilters,
		resetFilters
	}
} = filtersSlice

const selectState = (state: RootState) => state.filters
export const selectFiltersRequest = createTypedDraftSafeSelector(
	[selectState, selectFavorites],
	(
		{
			cutYears,
			cutMonths,
			geoBounds,
			ecological_zoning,
			statuses,
			areas,
			departments,
			excessive_slope,
			favorite,
			with_points
		},
		favorites
	): FiltersRequest | undefined => {
		const selectedFavoriteOption = favorite.find(
			(item) => item.isSelected
		)?.item
		return {
			geoBounds,
			cutYears: cutYears.filter((y) => y.isSelected).map((y) => y.item),
			cutMonths: cutMonths.filter((m) => m.isSelected).map((m) => m.item),
			departmentsIds: departments
				.filter((d) => d.isSelected)
				.map((d) => d.item.id),
			minAreaHectare: areas?.[0],
			maxAreaHectare: areas?.[1],
			statuses: statuses.filter((s) => s.isSelected).map((s) => s.item),
			hasEcologicalZonings: ecological_zoning.find((item) => item.isSelected)
				?.item,
			excessiveSlope: excessive_slope.find((item) => item.isSelected)?.item,
			inReportsIds: selectedFavoriteOption === true ? favorites : undefined,
			outReportsIds: selectedFavoriteOption === false ? favorites : undefined,
			withPoints: with_points
		}
	}
)

export const selectCutYears = createTypedDraftSafeSelector(
	selectState,
	(state) => state.pendingFilters.cutYears
)

export const selectCutMonths = createTypedDraftSafeSelector(
	selectState,
	(state) => state.pendingFilters.cutMonths
)

export const selectDepartments = createTypedDraftSafeSelector(
	selectState,
	(state) => state.pendingFilters.departments
)

export const selectStatuses = createTypedDraftSafeSelector(
	selectState,
	(state) => state.pendingFilters.statuses
)

export const selectTags = createTypedDraftSafeSelector(
	selectState,
	(state) => state.rules
)

export const selectAreas = createTypedDraftSafeSelector(
	selectState,
	(state) => state.pendingFilters.areas
)

export const selectAreaRange = createTypedDraftSafeSelector(
	selectState,
	(state) => state.area_range
)

export const selectEcologicalZoning = createTypedDraftSafeSelector(
	selectState,
	(state) => state.pendingFilters.ecological_zoning
)

export const selectExcessiveSlop = createTypedDraftSafeSelector(
	selectState,
	(state) => state.pendingFilters.excessive_slope
)

export const selectFavorite = createTypedDraftSafeSelector(
	selectState,
	(state) => state.pendingFilters.favorite
)

export const selectWithPoints = createTypedDraftSafeSelector(
	selectState,
	(state) => state.with_points
)

export const selectResetVersion = createTypedDraftSafeSelector(
	selectState,
	(state) => state.resetVersion
)
