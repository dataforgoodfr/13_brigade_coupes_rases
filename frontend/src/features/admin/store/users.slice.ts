import type { FiltersRequest } from "@/features/admin/store/filters";
import {
	type PaginatedUsers,
	type PaginatedUsersResponse,
	type User,
	paginatedUsersResponseSchema,
} from "@/features/admin/store/users";
import { selectFiltersRequest } from "@/features/admin/store/users-filters.slice";
import { requestToParams } from "@/shared/api/api";
import type { RequestedContent } from "@/shared/api/types";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { selectDepartmentsByIds } from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { createAppAsyncThunk } from "@/shared/store/thunk";
import { createSlice } from "@reduxjs/toolkit";
import { useMemo } from "react";

type State = {
	users: RequestedContent<PaginatedUsers>;
};
export const getUsersThunk = createAppAsyncThunk<
	PaginatedUsers,
	FiltersRequest
>("users/getUsers", async (request, { extra: { api }, getState }) => {
	const result = await api()
		.get<PaginatedUsersResponse>("api/v1/users", {
			searchParams: requestToParams(request),
		})
		.json();

	const paginatedUsers = paginatedUsersResponseSchema.parse(result);
	const state = getState();
	return {
		...paginatedUsers,
		content: paginatedUsers.content.map((user) => {
			return {
				...user,
				departments: selectDepartmentsByIds(state, user.departments_ids),
			} satisfies User;
		}),
	};
});

export const usersSlice = createSlice({
	initialState: { users: { status: "idle" } } as State,
	name: "users",
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(getUsersThunk.fulfilled, (state, { payload }) => {
			state.users.value = payload;
			state.users.status = "success";
		});
		builder.addCase(getUsersThunk.rejected, (state, _error) => {
			state.users.status = "error";
		});
		builder.addCase(getUsersThunk.pending, (state) => {
			state.users.status = "loading";
		});
	},
});

const selectState = (state: RootState) => state.users;
export const selectStatus = createTypedDraftSafeSelector(
	selectState,
	(state) => state.users.status,
);
export const selectUsers = createTypedDraftSafeSelector(
	selectState,
	(state) => state.users.value?.content ?? [],
);
export const selectMetadata = createTypedDraftSafeSelector(
	selectState,
	(state) => state.users.value?.metadata,
);
export const useGetUsers = () => {
	const request = useAppSelector(selectFiltersRequest);
	const dispatch = useAppDispatch();

	return useMemo(() => {
		return dispatch(getUsersThunk(request));
	}, [dispatch, request]);
};
