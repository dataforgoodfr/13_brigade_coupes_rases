import { selectFiltersRequest } from "@/features/admin/store/users-filters.slice";
import type { Users } from "@/features/admin/store/users-schemas";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { createAppAsyncThunk } from "@/shared/store/thunk";
import { type UnknownAction, createSlice } from "@reduxjs/toolkit";
import { useMemo } from "react";

interface FiltersState {
	status: "idle" | "loading" | "success" | "error";
	users: Users[];
}
const initialState: FiltersState = {
	status: "idle",
	users: [],
};

export const getUsersThunk = createAppAsyncThunk(
	"users/getUsers",
	async (_, { extra: { api } }) => {
		const result = await api().get<{ content: Users[] }>("api/v1/users").json();
		// TODO: Departements selection here & schema parse here
		return result;
	},
);

export const usersSlice = createSlice({
	initialState,
	name: "users",
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(getUsersThunk.fulfilled, (state, { payload }) => {
			state.status = "success";
			state.users = payload.content;
		});
		builder.addCase(getUsersThunk.rejected, (state, _error) => {
			state.status = "error";
		});
		builder.addCase(getUsersThunk.pending, (state) => {
			state.status = "loading";
		});
	},
});

const selectState = (state: RootState) => state.users;
export const selectStatus = createTypedDraftSafeSelector(
	selectState,
	(state) => state.status,
);
export const selectUsers = createTypedDraftSafeSelector(
	selectState,
	(state) => state.users,
);
export const useGetUsers = () => {
	const filters = useAppSelector(selectFiltersRequest);
	const dispatch = useAppDispatch();

	return useMemo(() => {
		// TODO: Add filters to the request & fix type
		return dispatch(getUsersThunk() as unknown as UnknownAction);
	}, [dispatch]);
};
