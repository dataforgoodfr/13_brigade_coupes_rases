import { selectFiltersRequest } from "@/features/admin/store/users-filters.slice";
import {
	type FiltersRequest,
	type UsersListResponse,
	usersListResponseSchema,
} from "@/features/admin/store/users-schemas";

import { useAppSelector } from "@/shared/hooks/store";
import { selectDepartmentsByIds } from "@/shared/store/referential/referential.slice";
import {
	createApi,
	fetchBaseQuery,
	skipToken,
} from "@reduxjs/toolkit/query/react";

export const adminApi = createApi({
	reducerPath: "api/admin",
	baseQuery: fetchBaseQuery({
		baseUrl: `${import.meta.env.VITE_API}`,
	}),
	endpoints: (builder) => ({
		getUsers: builder.query<UsersListResponse, FiltersRequest>({
			query: (filters) => ({ url: "users", params: filters }),
			transformResponse: (data) => usersListResponseSchema.parse(data),
		}),
	}),
});

export const { endpoints, useGetUsersQuery } = adminApi;

export function useGetFilteredUsersQuery() {
	const filters = useAppSelector(selectFiltersRequest);
	const { data, ...result } = adminApi.useGetUsersQuery(filters ?? skipToken);
	const users = useAppSelector((state) => {
		return data?.users.map((user) => ({
			...user,
			departments: selectDepartmentsByIds(state, user.departments),
		}));
	});
	return { ...result, data: { users } };
}
