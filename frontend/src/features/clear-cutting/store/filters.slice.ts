import {
	type FiltersRequest,
	type FiltersResponse,
	filtersResponseSchema,
} from "@/features/clear-cutting/store/filters";
import type { Bounds } from "@/features/clear-cutting/store/types";
import { api } from "@/shared/api/api";
import {
	type NamedId,
	type SelectableItem,
	listToSelectableItems,
} from "@/shared/items";
import type {
	Department,
	Status,
	Tag,
} from "@/shared/store/referential/referential";
import {
	selectDepartmentsByIds,
	selectStatusesByIds,
	selectTagsByIds,
} from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import {
	type PayloadAction,
	createAsyncThunk,
	createSlice,
} from "@reduxjs/toolkit";
export interface FiltersState {
	tags: SelectableItem<Tag>[];
	cutYears: SelectableItem<number>[];
	geoBounds?: Bounds;
	departments: SelectableItem<Department>[];
	statuses: SelectableItem<Status>[];
	areas: SelectableItem<number>[];
	excessiveSlop: boolean;
	ecologicalZoning: boolean;
	favorite: boolean;
}
export const initialState: FiltersState = {
	cutYears: [],
	tags: [],
	departments: [],
	areas: [],
	statuses: [],
	ecologicalZoning: false,
	excessiveSlop: false,
	favorite: false,
};

export const getFiltersThunk = createAsyncThunk(
	"filters/get",
	async (_arg, { getState }) => {
		const result = await api.get<FiltersResponse>("filters").json();
		const { departments, tags, statuses, ...response } =
			filtersResponseSchema.parse(result);
		const state = getState() as RootState;
		return {
			...response,
			departments: selectDepartmentsByIds(state, departments ?? []),
			tags: selectTagsByIds(state, tags ?? []),
			statuses: selectStatusesByIds(state, statuses ?? []),
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
		setAreas: (state, { payload }: PayloadAction<SelectableItem<number>[]>) => {
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
			{ payload }: PayloadAction<SelectableItem<Status>[]>,
		) => {
			state.statuses = payload;
		},
		setGeoBounds: (state, { payload }: PayloadAction<Bounds>) => {
			state.geoBounds = payload;
		},
		setEcologicalZoning: (state, { payload }: PayloadAction<boolean>) => {
			state.ecologicalZoning = payload;
		},
		setExcessiveSlop: (state, { payload }: PayloadAction<boolean>) => {
			state.excessiveSlop = payload;
		},
		setFavorite: (state, { payload }: PayloadAction<boolean>) => {
			state.favorite = payload;
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
						tags,
						departments,
						areaPresetsHectare,
						statuses,
						excessiveSlop,
						ecologicalZoning,
						favorite,
					},
				},
			) => {
				state.cutYears = listToSelectableItems(cutYears);
				state.tags = listToSelectableItems(tags);
				state.ecologicalZoning = ecologicalZoning ?? false;
				state.excessiveSlop = excessiveSlop ?? false;
				state.favorite = favorite ?? false;
				state.departments = listToSelectableItems(departments);
				state.areas = listToSelectableItems(areaPresetsHectare);
				state.statuses = listToSelectableItems(statuses);
			},
		);
	},
});

export const {
	actions: { updateCutYear: toggleCutYear, setGeoBounds },
} = filtersSlice;

const selectState = (state: RootState) => state.filters;
export const selectFiltersRequest = createTypedDraftSafeSelector(
	selectState,
	({
		cutYears,
		geoBounds,
		ecologicalZoning,
		statuses,
		areas,
		departments,
		excessiveSlop,
		favorite,
	}): FiltersRequest | undefined =>
		geoBounds === undefined
			? undefined
			: {
					geoBounds,
					cutYears: cutYears.filter((y) => y.isSelected).map((y) => y.item),
					departments: departments
						.filter((d) => d.isSelected)
						.map((d) => d.item.id),
					areas: areas.filter((a) => a.isSelected).map((a) => a.item),
					statuses: statuses.filter((s) => s.isSelected).map((s) => s.item.id),
					ecologicalZoning,
					excessiveSlop,
					favorite,
				},
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
	(state) => state.tags,
);

export const selectAreaPresetsHectare = createTypedDraftSafeSelector(
	selectState,
	(state) => state.areas,
);

export const selectEcologicalZoning = createTypedDraftSafeSelector(
	selectState,
	(state) => state.ecologicalZoning,
);
export const selectExcessiveSlop = createTypedDraftSafeSelector(
	selectState,
	(state) => state.excessiveSlop,
);
export const selectFavorite = createTypedDraftSafeSelector(
	selectState,
	(state) => state.favorite,
);
