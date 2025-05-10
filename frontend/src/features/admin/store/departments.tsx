import type { Department } from "@/features/admin/store/departments-schemas";
import { useAppDispatch } from "@/shared/hooks/store";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { createAppAsyncThunk } from "@/shared/store/thunk";
import { createSlice } from "@reduxjs/toolkit";
import { useMemo } from "react";

interface DepartementsResponse {
	status: "idle" | "loading" | "success" | "error";
	departments: Department[];
}

const initialState: DepartementsResponse = {
	status: "idle",
	departments: [],
};

export const getDepartmentsThunk = createAppAsyncThunk(
	"departments/getDepartments",
	async (_, { extra: { api } }) => {
		const result = await api()
			.get<{
				content: Department[];
			}>("api/v1/departments")
			.json();

		return result;
	},
);

export const departmentsSlice = createSlice({
	initialState,
	name: "departments",
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(getDepartmentsThunk.fulfilled, (state, { payload }) => {
			state.status = "success";
			state.departments = payload.content;
		});
		builder.addCase(getDepartmentsThunk.rejected, (state, _error) => {
			state.status = "error";
		});
		builder.addCase(getDepartmentsThunk.pending, (state) => {
			state.status = "loading";
		});
	},
});

const selectState = (state: RootState) => state.departments;
export const selectStatus = createTypedDraftSafeSelector(
	selectState,
	(state) => state.status,
);
export const selectDepartments = createTypedDraftSafeSelector(
	selectState,
	(state) => state.departments,
);

export const useGetDepartments = () => {
	const dispatch = useAppDispatch();

	return useMemo(() => {
		return dispatch(getDepartmentsThunk());
	}, [dispatch]);
};
