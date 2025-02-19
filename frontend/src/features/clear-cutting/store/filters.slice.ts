import { endpoints } from "@/features/clear-cutting/store/api";
import type {
	FiltersRequest,
	Tag,
} from "@/features/clear-cutting/store/filters";
import type { Bounds } from "@/features/clear-cutting/store/types";
import {
	type NamedId,
	type SelectableItem,
	listToSelectableItems,
	recordToSelectableItemsTransformed,
} from "@/shared/items";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
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
	ecologicalZoning: [],
	regions: [],
	departments: [],
};
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
		setGeoBounds: (state, { payload }: PayloadAction<Bounds>) => {
			state.geoBounds = payload;
		},
	},
	extraReducers: (builder) => {
		builder.addMatcher(
			endpoints.getFilters.matchFulfilled,
			(state, { payload: { cutYears, tags, ecologicalZoning } }) => {
				state.cutYears = listToSelectableItems(cutYears);
				state.tags = listToSelectableItems(tags);
				state.ecologicalZoning = recordToSelectableItemsTransformed(
					ecologicalZoning,
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
	({
		cutYears,
		tags,
		geoBounds,
		ecologicalZoning,
	}): FiltersRequest | undefined =>
		geoBounds === undefined
			? undefined
			: {
					geoBounds,
					tags: tags.filter((t) => t.isSelected).map((t) => t.item.id),
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

export const selectTags = createTypedDraftSafeSelector(
	selectState,
	(state) => state.tags,
);
