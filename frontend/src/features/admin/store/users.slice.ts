import { createSlice } from "@reduxjs/toolkit"
import { trimStart } from "es-toolkit"
import { useEffect } from "react"

import type { FiltersRequest } from "@/features/admin/store/filters"
import {
	type EditUserRequest,
	type PaginatedUsers,
	type PaginatedUsersResponse,
	paginatedUsersResponseSchema,
	type User,
	type UserAlreadyExistsError,
	type UserForm,
	type UserNotFoundError,
	type UserResponse,
	userAlreadyExistsErrorSchema,
	userNotFoundErrorSchema,
	userResponseSchema
} from "@/features/admin/store/users"
import { selectFiltersRequest } from "@/features/admin/store/users-filters.slice"
import { requestToParams } from "@/shared/api/api"
import type { RequestedContent } from "@/shared/api/types"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"
import { selectDepartmentsByIds } from "@/shared/store/referential/referential.slice"
import { createTypedDraftSafeSelector } from "@/shared/store/selector"
import type { RootState } from "@/shared/store/store"
import {
	addRequestedContentCases,
	createAppAsyncThunk
} from "@/shared/store/thunk"

const EMPTY_USERS: User[] = []

type State = {
	users: RequestedContent<PaginatedUsers>
	editedUser: RequestedContent<
		UserResponse,
		UserAlreadyExistsError | UserNotFoundError
	>
	deletedUser: RequestedContent<void, UserNotFoundError>
}

export const deleteUserThunk = createAppAsyncThunk<void, string>(
	"deleteUser",
	async (request, { extra: { api }, dispatch }) => {
		await api().delete(`api/v1/users/${request}/`)
		dispatch(getUsersThunk())
	}
)

export const createUserThunk = createAppAsyncThunk<UserResponse, UserForm>(
	"createUser",
	async (request, { extra: { api }, dispatch }) => {
		const response = await api().post<PaginatedUsersResponse>("api/v1/users/", {
			json: {
				...request,
				departments: request.departments
					.filter((d) => d.isSelected)
					.map((d) => d.item.id)
			} satisfies EditUserRequest
		})

		const createdUser = await api()
			.get(trimStart(response.headers.get("location") as string, "/"))
			.json()
		dispatch(getUsersThunk())
		return userResponseSchema.parse(createdUser)
	}
)

export const updateUserThunk = createAppAsyncThunk<
	UserResponse,
	UserForm & { id: string }
>("updateUser", async (request, { extra: { api }, dispatch }) => {
	const url = `api/v1/users/${request.id}/`
	await api().put<PaginatedUsersResponse>(url, {
		json: {
			...request,
			departments: request.departments
				.filter((d) => d.isSelected)
				.map((d) => d.item.id)
		} satisfies EditUserRequest
	})

	const updatedUser = await api().get(url).json()
	dispatch(getUsersThunk())
	return userResponseSchema.parse(updatedUser)
})

export const getUsersThunk = createAppAsyncThunk<
	PaginatedUsers,
	FiltersRequest | undefined
>("getUsers", async (request, { extra: { api }, getState }) => {
	const result = await api()
		.get<PaginatedUsersResponse>("api/v1/users/", {
			searchParams: requestToParams(request ?? selectFiltersRequest(getState()))
		})
		.json()

	const paginatedUsers = paginatedUsersResponseSchema.parse(result)
	const state = getState()
	return {
		...paginatedUsers,
		content: paginatedUsers.content.map((user) => {
			return {
				...user,
				departments: selectDepartmentsByIds(state, user.departments)
			} satisfies User
		})
	}
})

const initialState: State = {
	users: { status: "idle" },
	editedUser: { status: "idle" },
	deletedUser: { status: "idle" }
}

export const usersSlice = createSlice({
	initialState,
	name: "users",
	reducers: {
		resetDeletedUser: (state) => {
			state.deletedUser.status = "idle"
			state.deletedUser.error = undefined
		},
		resetEditedUser: (state) => {
			state.editedUser.status = "idle"
			state.editedUser.error = undefined
		}
	},
	extraReducers: (builder) => {
		addRequestedContentCases(builder, getUsersThunk, (state) => state.users)
		addRequestedContentCases(
			builder,
			createUserThunk,
			(state) => state.editedUser,
			{ errorSchema: userAlreadyExistsErrorSchema }
		)
		addRequestedContentCases(
			builder,
			updateUserThunk,
			(state) => state.editedUser,
			{ errorSchema: userNotFoundErrorSchema }
		)
		addRequestedContentCases(
			builder,
			deleteUserThunk,
			(state) => state.deletedUser,
			{ errorSchema: userNotFoundErrorSchema }
		)
	}
})

const selectState = (state: RootState) => state.users

export const selectStatus = createTypedDraftSafeSelector(
	selectState,
	(state) => state.users.status
)

export const selectUsers = createTypedDraftSafeSelector(
	selectState,
	(state) => state.users.value?.content ?? EMPTY_USERS
)

export const selectMetadata = createTypedDraftSafeSelector(
	selectState,
	(state) => state.users.value?.metadata
)

export const selectEditedUser = createTypedDraftSafeSelector(
	selectState,
	(s) => s.editedUser
)

export const selectDeletedUser = createTypedDraftSafeSelector(
	selectState,
	(s) => s.deletedUser
)

export const useGetUsers = () => {
	const request = useAppSelector(selectFiltersRequest)
	const dispatch = useAppDispatch()

	useEffect(() => {
		dispatch(getUsersThunk(request))
	}, [dispatch, request])
}
