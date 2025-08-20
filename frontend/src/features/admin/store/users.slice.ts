import { createSlice } from "@reduxjs/toolkit";
import { trimStart } from "es-toolkit";
import { useEffect } from "react";
import type { FiltersRequest } from "@/features/admin/store/filters";
import {
	type CreateUserError,
	type CreateUserRequest,
	createUserErrorSchema,
	type PaginatedUsers,
	type PaginatedUsersResponse,
	paginatedUsersResponseSchema,
	type User,
	type UserForm,
	type UserResponse,
	userResponseSchema,
} from "@/features/admin/store/users";
import { selectFiltersRequest } from "@/features/admin/store/users-filters.slice";
import { requestToParams } from "@/shared/api/api";
import type { RequestedContent } from "@/shared/api/types";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { selectDepartmentsByIds } from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { createAppAsyncThunk } from "@/shared/store/thunk";

const EMPTY_USERS: User[] = [];

type State = {
	users: RequestedContent<PaginatedUsers>;
	createdUser: RequestedContent<UserResponse, CreateUserError>;
};

export const createUserThunk = createAppAsyncThunk<UserResponse, UserForm>(
	"createUser",
	async (request, { extra: { api } }) => {
		const response = await api().post<PaginatedUsersResponse>("api/v1/users", {
			json: {
				...request,
				departments: request.departments
					.filter((d) => d.isSelected)
					.map((d) => d.item.id),
			} satisfies CreateUserRequest,
		});

		const createdUser = await api()
			.get(trimStart(response.headers.get("location") as string, "/"))
			.json();
		return userResponseSchema.parse(createdUser);
	},
);
export const getUsersThunk = createAppAsyncThunk<
	PaginatedUsers,
	FiltersRequest
>("getUsers", async (request, { extra: { api }, getState }) => {
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
				departments: selectDepartmentsByIds(state, user.departments),
			} satisfies User;
		}),
	};
});
const initialState: State = {
	users: { status: "idle" },
	createdUser: { status: "idle" },
};
export const usersSlice = createSlice({
	initialState,
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
		builder.addCase(createUserThunk.fulfilled, (state, { payload }) => {
			state.createdUser.value = payload;
			state.createdUser.status = "success";
		});
		builder.addCase(createUserThunk.rejected, (state, { payload }) => {
			const parsedPayload = createUserErrorSchema.parse(payload);
			state.createdUser.status = "error";
			state.createdUser.error = parsedPayload;
		});
		builder.addCase(createUserThunk.pending, (state) => {
			state.createdUser.status = "loading";
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
	(state) => state.users.value?.content ?? EMPTY_USERS,
);
export const selectMetadata = createTypedDraftSafeSelector(
	selectState,
	(state) => state.users.value?.metadata,
);
export const selectCreatedUser = createTypedDraftSafeSelector(
	selectState,
	(s) => s.createdUser,
);
export const useGetUsers = () => {
	const request = useAppSelector(selectFiltersRequest);
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(getUsersThunk(request));
	}, [dispatch, request]);
};
