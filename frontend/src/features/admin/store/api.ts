import { selectFiltersRequest } from "@/features/admin/store/users-filters.slice";
import {
	type FiltersRequest,
	type UsersListResponse,
	usersListResponseSchema,
} from "@/features/admin/store/users-schemas";

import { useAppSelector } from "@/shared/hooks/store";
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

export const { endpoints } = adminApi;

export function useGetAdminQuery() {
	const filters = useAppSelector(selectFiltersRequest);
	return adminApi.useGetUsersQuery(filters ?? skipToken);
}
