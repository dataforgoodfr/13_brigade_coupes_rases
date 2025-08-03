import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
	FiltersRequest,
	SortableKeys,
} from "@/features/admin/store/filters";
import type { Role } from "@/features/user/store/user";
import type { Sort } from "@/shared/api/api";
import {
	listToSelectableItems,
	type NamedId,
	type SelectableItem,
} from "@/shared/items";
import { getReferentialThunk } from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";

interface FiltersState {
	name: string;
	roles: SelectableItem<Role>[];
	departments: SelectableItem<NamedId>[];
	ascSort: SortableKeys;
	descSort: SortableKeys;
	page: number;
	size: number;
}
const initialState: FiltersState = {
	name: "",
	roles: [
		{ isSelected: true, item: "admin" },
		{ isSelected: true, item: "volunteer" },
	],
	departments: [],
	ascSort: [],
	descSort: [],
	page: 0,
	size: 10,
};

export const usersFiltersSlice = createSlice({
	initialState,
	name: "usersFilters",
	reducers: {
		setName: (state, { payload }: PayloadAction<string>) => {
			state.name = payload;
		},
		setRoles: (state, { payload }: PayloadAction<SelectableItem<Role>[]>) => {
			state.roles = payload;
		},
		toggleSort: (state, { payload }: PayloadAction<SortableKeys[number]>) => {
			if (state.ascSort.includes(payload)) {
				state.ascSort = state.ascSort.filter((col) => col !== payload);
				state.descSort.push(payload);
			} else if (state.descSort.includes(payload)) {
				state.descSort = state.descSort.filter((col) => col !== payload);
			} else {
				state.ascSort.push(payload);
			}
		},
		setDepartments: (
			state,
			{ payload }: PayloadAction<SelectableItem<NamedId>[]>,
		) => {
			state.departments = payload;
		},
		setPage: (state, { payload }: PayloadAction<number>) => {
			state.page = payload;
		},
		setSize: (state, { payload }: PayloadAction<number>) => {
			state.size = payload;
		},
	},
	extraReducers: (builder) => {
		builder.addCase(getReferentialThunk.fulfilled, (state, { payload }) => {
			state.departments = payload.departments
				? listToSelectableItems(
						Object.entries(payload.departments).map(
							([id, dpt]) => ({ id, name: dpt.name }) satisfies NamedId,
						),
					)
				: [];
		});
	},
});

const selectState = (state: RootState) => state.usersFilters;
export const selectFiltersRequest = createTypedDraftSafeSelector(
	selectState,
	({
		name,
		roles,
		departments,
		page,
		size,
		ascSort,
		descSort,
	}): FiltersRequest => {
		return {
			name,
			roles: roles.filter((role) => role.isSelected).map((role) => role.item),
			departmentsIds: departments
				.filter((department) => department.isSelected)
				.map((department) => department.item.id),
			page,
			size,
			ascSort,
			descSort,
		};
	},
);

export const selectName = createTypedDraftSafeSelector(
	selectState,
	(state) => state.name,
);

export const selectRoles = createTypedDraftSafeSelector(
	selectState,
	(state) => state.roles,
);

export const selectDepartments = createTypedDraftSafeSelector(
	selectState,
	(state) => state.departments,
);

export const selectColumnSort = (column: SortableKeys[number]) =>
	createTypedDraftSafeSelector(selectState, (state): Sort | undefined =>
		state.ascSort.includes(column)
			? "asc"
			: state.descSort.includes(column)
				? "desc"
				: undefined,
	);
export const selectPage = createTypedDraftSafeSelector(
	selectState,
	(state) => state.page,
);

export const selectSize = createTypedDraftSafeSelector(
	selectState,
	(state) => state.size,
);
