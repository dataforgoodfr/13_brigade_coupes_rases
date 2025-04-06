import type { FiltersRequest } from "@/features/admin/store/users-schemas";
import type { Role } from "@/features/user/store/user";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

interface FiltersState {
	name: string;
	role: Role | "all";
	departments: string[];
}
const initialState: FiltersState = {
	name: "",
	role: "all",
	departments: [],
};

export const usersFiltersSlice = createSlice({
	initialState,
	name: "usersFilters",
	reducers: {
		setName: (state, { payload }: PayloadAction<string>) => {
			state.name = payload;
		},
		setRole: (state, { payload }: PayloadAction<Role | "all">) => {
			state.role = payload;
		},
		toggleDepartment: (state, { payload }: PayloadAction<string>) => {
			const departmentIdx = state.departments.findIndex(
				(department) => department === payload,
			);

			if (departmentIdx === -1) {
				state.departments.push(payload);
			} else {
				state.departments.splice(departmentIdx, 1);
			}
		},
	},
});

export const {
	actions: { setName, setRole, toggleDepartment },
} = usersFiltersSlice;

const selectState = (state: RootState) => state.usersFilters;
export const selectFiltersRequest = createTypedDraftSafeSelector(
	selectState,
	({ name, role, departments }): FiltersRequest | undefined => {
		return {
			name,
			role: role === "all" ? undefined : role,
			departments: departments,
		};
	},
);

export const selectName = createTypedDraftSafeSelector(
	selectState,
	(state) => state.name,
);

export const selectRole = createTypedDraftSafeSelector(
	selectState,
	(state) => state.role,
);

export const selectDepartments = createTypedDraftSafeSelector(
	selectState,
	(state) => state.departments,
);
