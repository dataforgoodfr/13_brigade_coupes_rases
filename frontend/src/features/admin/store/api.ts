import { selectFiltersRequest } from "@/features/admin/store/users-filters.slice";
import {
	type FiltersRequest,
	type UsersListResponse,
	usersListResponseSchema,
} from "@/features/admin/store/users-schemas";

import { getStoredToken } from "@/features/user/store/user.slice";
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
		prepareHeaders: (headers) => {
			const token = getStoredToken();
			if (token) {
				headers.set("Authorization", `Bearer ${token.access_token}`);
			}
			return headers;
		},
	}),
	endpoints: (builder) => ({
		getUsers: builder.query<UsersListResponse, FiltersRequest>({
			query: (filters) => ({ url: "api/v1/users", params: filters }),
			transformResponse: (data: any) =>
				usersListResponseSchema.parse({ users: data.content }),
		}),
	}),
});

export const { endpoints } = adminApi;

export function useGetAdminQuery() {
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
