import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ClearCutStatus } from "@/features/clear-cut/store/clear-cuts";
import {
	type FiltersRequest,
	type FiltersResponse,
	filtersResponseSchema,
} from "@/features/clear-cut/store/filters";
import type { Bounds } from "@/features/clear-cut/store/types";
import { selectFavorites } from "@/features/user/store/me.slice";
import {
	booleanToSelectableItem,
	DEFAULT_EVENTUALLY_BOOLEAN,
	type EventuallyBooleanSelectableItems,
	listToSelectableItems,
	type NamedId,
	type SelectableItem,
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
export interface FiltersState {
	rules: SelectableItem<Rule>[];
	cutYears: SelectableItem<number>[];
	cutMonths: SelectableItem<number>[];
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
	cutMonths: [],
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
			departmentsIds: departments_ids,
			rulesIds: tags_ids,
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
		setCutMonths: (
			state,
			{ payload }: PayloadAction<SelectableItem<number>[]>,
		) => {
			state.cutMonths = payload;
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
						cutYears,
						rules,
						departments,
						areaRange: area_range,
						statuses,
						excessiveSlope: excessive_slope,
						hasEcologicalZonings: ecological_zoning,
						favorite,
					},
				},
			) => {
				state.areas = [area_range.min, area_range.max];
				state.cutYears = listToSelectableItems(cutYears);
				state.cutMonths = listToSelectableItems([
					1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
				]);
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
			with_points,
		},
		favorites,
	): FiltersRequest | undefined => {
		const selectedFavoriteOption = favorite.find(
			(item) => item.isSelected,
		)?.item;
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
			withPoints: with_points,
		};
	},
);

export const selectCutYears = createTypedDraftSafeSelector(
	selectState,
	(state) => state.cutYears,
);
export const selectCutMonths = createTypedDraftSafeSelector(
	selectState,
	(state) => state.cutMonths,
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
