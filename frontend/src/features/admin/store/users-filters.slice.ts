import type { FiltersRequest } from "@/features/admin/store/filters";
import type { Role } from "@/features/user/store/user";
import {
	type NamedId,
	type SelectableItem,
	listToSelectableItems,
} from "@/shared/items";
import { getReferentialThunk } from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

interface FiltersState {
	name: string;
	roles: SelectableItem<Role>[];
	departments: SelectableItem<NamedId>[];
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
	({ name, roles, departments, page, size }): FiltersRequest => {
		return {
			name,
			roles: roles.filter((role) => role.isSelected).map((role) => role.item),
			departments_ids: departments
				.filter((department) => department.isSelected)
				.map((department) => department.item.id),
			page,
			size,
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

export const selectPage = createTypedDraftSafeSelector(
	selectState,
	(state) => state.page,
);

export const selectSize = createTypedDraftSafeSelector(
	selectState,
	(state) => state.size,
);
