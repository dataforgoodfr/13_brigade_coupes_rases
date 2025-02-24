import {
	type FiltersRequest,
	type FiltersResponse,
	type Tag,
	filtersResponseSchema,
} from "@/features/clear-cutting/store/filters";
import type { Bounds } from "@/features/clear-cutting/store/types";
import { api } from "@/shared/api/api";
import {
	type NamedId,
	type SelectableItem,
	listToSelectableItems,
	recordToSelectableItemsTransformed,
} from "@/shared/items";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import {
	type PayloadAction,
	createAsyncThunk,
	createSlice,
} from "@reduxjs/toolkit";
interface FiltersState {
	tags: SelectableItem<Tag>[];
	cutYears: SelectableItem<number>[];
	geoBounds?: Bounds;
	ecologicalZoning: SelectableItem<NamedId>[];
	departments: SelectableItem<NamedId>[];
	regions: SelectableItem<NamedId>[];
}
const initialState: FiltersState = {
	cutYears: [],
	tags: [],
	departments: [],
	ecologicalZoning: [],
	regions: [],
};

export const getFiltersThunk = createAsyncThunk("filters/get", async () => {
	const result = await api.get<FiltersResponse>("filters").json();
	return filtersResponseSchema.parse(result);
});
export const filtersSlice = createSlice({
	initialState,
	name: "filters",
	reducers: {
		toggleTag: (state, { payload }: PayloadAction<string>) => {
			state.tags = state.tags.map((t) =>
				t.item.name === payload ? { ...t, isSelected: !t.isSelected } : t,
			);
		},
		toggleCutYear: (state, { payload }: PayloadAction<number>) => {
			state.cutYears = state.cutYears.map((y) =>
				y.item === payload ? { ...y, isSelected: !y.isSelected } : y,
			);
		},
		toggleDepartment: (state, { payload }: PayloadAction<NamedId>) => {
			state.departments = state.departments.map((d) =>
				d.item.id === payload.id ? { ...d, isSelected: !d.isSelected } : d,
			);
		},
		setGeoBounds: (state, { payload }: PayloadAction<Bounds>) => {
			state.geoBounds = payload;
		},
	},
	extraReducers: (builder) => {
		builder.addCase(
			getFiltersThunk.fulfilled,
			(
				state,
				{ payload: { cutYears, tags, ecologicalZoning, departments } },
			) => {
				state.cutYears = listToSelectableItems(cutYears);
				state.tags = listToSelectableItems(tags);
				state.ecologicalZoning = recordToSelectableItemsTransformed(
					ecologicalZoning,
					(key, name) => ({ id: key, name: name }),
				);
				state.departments = recordToSelectableItemsTransformed(
					departments,
					(key, name) => ({ id: key, name: name }),
				);
			},
		);
	},
});

export const {
	actions: { toggleCutYear, setGeoBounds, toggleTag },
} = filtersSlice;

const selectState = (state: RootState) => state.filters;
export const selectFiltersRequest = createTypedDraftSafeSelector(
	selectState,
	({ cutYears, geoBounds, ecologicalZoning }): FiltersRequest | undefined =>
		geoBounds === undefined
			? undefined
			: {
					geoBounds,
					cutYears: cutYears.filter((y) => y.isSelected).map((y) => y.item),
					ecologicalZoning: ecologicalZoning
						.filter((z) => z.isSelected)
						.map((z) => z.item.id),
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
export const selectTags = createTypedDraftSafeSelector(
	selectState,
	(state) => state.tags,
);
