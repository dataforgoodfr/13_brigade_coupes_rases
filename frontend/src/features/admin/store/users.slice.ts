import {
	selectPage,
	selectSize,
} from "@/features/admin/store/users-filters.slice";
import type { User } from "@/features/admin/store/users-schemas";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { createAppAsyncThunk } from "@/shared/store/thunk";
import { createSlice } from "@reduxjs/toolkit";
import { useMemo } from "react";

interface UsersResponse {
	status: "idle" | "loading" | "success" | "error";
	users: User[];
	metadata: {
		totalCount?: number;
		pagesCount?: number;
	};
}
const initialState: UsersResponse = {
	status: "idle",
	users: [],
	metadata: {},
};

export const createUserThunk = createAppAsyncThunk(
	"users/createUser",
	async (user: User, { extra: { api } }) => {
		await api()
			.post<User>("api/v1/users", { body: JSON.stringify(user) })
			.catch((error) => {
				const validationErrors = error.data.errors;
				throw new Error(JSON.stringify(validationErrors));
			});
	},
);

export const updateUserThunk = createAppAsyncThunk(
	"users/insertUser",
	async (user: User, { extra: { api } }) => {
		await api().put<User>(`api/v1/users/${user.id}`, {
			body: JSON.stringify(user),
		});
	},
);

export const getUsersThunk = createAppAsyncThunk(
	"users/getUsers",
	async (params: { page: number; size: number }, { extra: { api } }) => {
		const result = await api()
			.get<{
				content: User[];
				metadata: {
					total_count: number;
					pages_count: number;
				};
			}>("api/v1/users", {
				searchParams: {
					page: params.page,
					size: params.size,
				},
			})
			.json();

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
			state.metadata.totalCount = payload.metadata.total_count;
			state.metadata.pagesCount = payload.metadata.pages_count;
		});
		builder.addCase(getUsersThunk.rejected, (state, _error) => {
			state.status = "error";
		});
		builder.addCase(getUsersThunk.pending, (state) => {
			state.status = "loading";
		});

		builder.addCase(createUserThunk.fulfilled, (state) => {
			state.status = "success";
		});
		builder.addCase(createUserThunk.rejected, (state, _error) => {
			state.status = "error";
		});
		builder.addCase(createUserThunk.pending, (state) => {
			state.status = "loading";
		});

		builder.addCase(updateUserThunk.fulfilled, (state) => {
			state.status = "success";
		});
		builder.addCase(updateUserThunk.rejected, (state, _error) => {
			state.status = "error";
		});
		builder.addCase(updateUserThunk.pending, (state) => {
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
export const selectMetadata = createTypedDraftSafeSelector(
	selectState,
	(state) => state.metadata,
);
export const useGetUsers = () => {
	const page = useAppSelector(selectPage);
	const size = useAppSelector(selectSize);

	const dispatch = useAppDispatch();

	return useMemo(() => {
		return dispatch(getUsersThunk({ page, size }));
	}, [dispatch, page, size]);
};
