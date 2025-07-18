import type { ClearCutStatus } from "@/features/clear-cut/store/clear-cuts";
import {
	type FiltersRequest,
	type FiltersResponse,
	filtersResponseSchema,
} from "@/features/clear-cut/store/filters";
import type { Bounds } from "@/features/clear-cut/store/types";
import {
	DEFAULT_EVENTUALLY_BOOLEAN,
	type EventuallyBooleanSelectableItems,
	type NamedId,
	type SelectableItem,
	booleanToSelectableItem,
	listToSelectableItems,
	updateEventuallyBooleanSelectableItem,
} from "@/shared/items";
import type { Department, Rule } from "@/shared/store/referential/referential";
import {
	selectDepartmentsByIds,
	selectRulesByIds,
} from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { createAppAsyncThunk } from "@/shared/store/thunk";
import type { Range } from "@/shared/types/range";
import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
export interface FiltersState {
	rules: SelectableItem<Rule>[];
	cutYears: SelectableItem<number>[];
	geoBounds?: Bounds;
	area_range: Range;
	departments: SelectableItem<Department>[];
	statuses: SelectableItem<ClearCutStatus>[];
	areas?: [number, number];
	excessive_slope: EventuallyBooleanSelectableItems;
	ecological_zoning: EventuallyBooleanSelectableItems;
	favorite: EventuallyBooleanSelectableItems;
	with_points?: boolean;
}
export const initialState: FiltersState = {
	cutYears: [],
	rules: [],
	departments: [],
	area_range: { min: 0, max: 0 },
	statuses: [],
	excessive_slope: DEFAULT_EVENTUALLY_BOOLEAN,
	ecological_zoning: DEFAULT_EVENTUALLY_BOOLEAN,
	favorite: DEFAULT_EVENTUALLY_BOOLEAN,
};

export const getFiltersThunk = createAppAsyncThunk(
	"filters/get",
	async (_arg, { getState, extra: { api } }) => {
		const result = await api().get<FiltersResponse>("api/v1/filters").json();
		const {
			departments_ids,
			rules_ids: tags_ids,
			...response
		} = filtersResponseSchema.parse(result);
		const state = getState();
		return {
			...response,
			departments: selectDepartmentsByIds(state, departments_ids ?? []),
			rules: selectRulesByIds(state, tags_ids ?? []),
		};
	},
);
export const filtersSlice = createSlice({
	initialState,
	name: "filters",
	reducers: {
		updateCutYear: (
			state,
			{ payload }: PayloadAction<SelectableItem<number>>,
		) => {
			state.cutYears = state.cutYears.map((y) =>
				y.item === payload.item ? payload : y,
			);
		},
		setCutYears: (
			state,
			{ payload }: PayloadAction<SelectableItem<number>[]>,
		) => {
			state.cutYears = payload;
		},
		setAreas: (
			state,
			{ payload }: PayloadAction<[number, number] | undefined>,
		) => {
			state.areas = payload;
		},
		updateDepartment: (
			state,
			{ payload }: PayloadAction<SelectableItem<NamedId>>,
		) => {
			state.departments = state.departments.map((d) =>
				d.item.id === payload.item.id ? payload : d,
			);
		},
		setDepartments: (
			state,
			{ payload }: PayloadAction<SelectableItem<NamedId>[]>,
		) => {
			state.departments = payload;
		},
		setStatuses: (
			state,
			{ payload }: PayloadAction<SelectableItem<ClearCutStatus>[]>,
		) => {
			state.statuses = payload;
		},
		setGeoBounds: (state, { payload }: PayloadAction<Bounds>) => {
			if (
				payload.ne.lat === payload.sw.lat &&
				payload.ne.lng === payload.sw.lng
			) {
				state.geoBounds = undefined;
			} else {
				state.geoBounds = payload;
			}
		},
		setHasEcologicalZoning: (
			state,
			{ payload }: PayloadAction<SelectableItem<boolean | undefined>>,
		) => {
			state.ecological_zoning = updateEventuallyBooleanSelectableItem(
				payload,
				state.ecological_zoning,
			);
		},
		setExcessiveSlop: (
			state,
			{ payload }: PayloadAction<SelectableItem<boolean | undefined>>,
		) => {
			state.excessive_slope = updateEventuallyBooleanSelectableItem(
				payload,
				state.excessive_slope,
			);
		},
		setFavorite: (
			state,
			{ payload }: PayloadAction<SelectableItem<boolean | undefined>>,
		) => {
			state.favorite = updateEventuallyBooleanSelectableItem(
				payload,
				state.favorite,
			);
		},
		setWithPoints: (state, { payload }: PayloadAction<boolean>) => {
			state.with_points = payload;
		},
	},
	extraReducers: (builder) => {
		builder.addCase(
			getFiltersThunk.fulfilled,
			(
				state,
				{
					payload: {
						cut_years: cutYears,
						rules,
						departments,
						area_range,
						statuses,
						excessive_slope,
						has_ecological_zonings: ecological_zoning,
						favorite,
					},
				},
			) => {
				state.areas = [area_range.min, area_range.max];
				state.cutYears = listToSelectableItems(cutYears);
				state.rules = listToSelectableItems(rules);
				state.ecological_zoning = booleanToSelectableItem(ecological_zoning);
				state.excessive_slope = booleanToSelectableItem(excessive_slope);
				state.favorite = booleanToSelectableItem(favorite);
				state.departments = listToSelectableItems(departments);
				state.area_range = area_range;
				state.statuses = listToSelectableItems(statuses);
			},
		);
	},
});

export const {
	actions: { updateCutYear: toggleCutYear, setGeoBounds, setWithPoints },
} = filtersSlice;

const selectState = (state: RootState) => state.filters;
export const selectFiltersRequest = createTypedDraftSafeSelector(
	selectState,
	({
		cutYears,
		geoBounds,
		ecological_zoning,
		statuses,
		areas,
		departments,
		excessive_slope,
		favorite,
		with_points,
	}): FiltersRequest | undefined => ({
		geoBounds,
		cut_years: cutYears.filter((y) => y.isSelected).map((y) => y.item),
		departments_ids: departments
			.filter((d) => d.isSelected)
			.map((d) => d.item.id),
		min_area_hectare: areas?.[0],
		max_area_hectare: areas?.[1],
		statuses: statuses.filter((s) => s.isSelected).map((s) => s.item),
		has_ecological_zonings: ecological_zoning.find((item) => item.isSelected)
			?.item,
		excessive_slope: excessive_slope.find((item) => item.isSelected)?.item,
		favorite: favorite.find((item) => item.isSelected)?.item,
		with_points,
	}),
);

export const selectCutYears = createTypedDraftSafeSelector(
	selectState,
	(state) => state.cutYears,
);
export const selectDepartments = createTypedDraftSafeSelector(
	selectState,
	(state) => state.departments,
);
export const selectStatuses = createTypedDraftSafeSelector(
	selectState,
	(state) => state.statuses,
);
export const selectTags = createTypedDraftSafeSelector(
	selectState,
	(state) => state.rules,
);

export const selectAreas = createTypedDraftSafeSelector(
	selectState,
	(state) => state.areas,
);
export const selectAreaRange = createTypedDraftSafeSelector(
	selectState,
	(state) => state.area_range,
);
export const selectEcologicalZoning = createTypedDraftSafeSelector(
	selectState,
	(state) => state.ecological_zoning,
);
export const selectExcessiveSlop = createTypedDraftSafeSelector(
	selectState,
	(state) => state.excessive_slope,
);
export const selectFavorite = createTypedDraftSafeSelector(
	selectState,
	(state) => state.favorite,
);
export const selectWithPoints = createTypedDraftSafeSelector(
	selectState,
	(state) => state.with_points,
);
