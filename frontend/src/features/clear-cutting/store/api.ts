import { selectFiltersRequest } from "@/features/clear-cutting/store/filters.slice";
import { useAppSelector } from "@/shared/hooks/store";
import {
	createApi,
	fetchBaseQuery,
	skipToken,
} from "@reduxjs/toolkit/query/react";
import {
	type ClearCutting,
	type ClearCuttingsResponse,
	clearCuttingSchema,
	clearCuttingsResponseSchema,
} from "./clear-cuttings";
import {
	type FiltersRequest,
	type FiltersResponse,
	filtersResponseSchema,
} from "./filters";

export const clearCuttingsApi = createApi({
	reducerPath: "api/clearCuttings",
	baseQuery: fetchBaseQuery({
		baseUrl: `${import.meta.env.VITE_API}`,
	}),
	endpoints: (builder) => ({
		getFilters: builder.query<FiltersResponse, void>({
			query: () => "filters",
			transformResponse: (data) => filtersResponseSchema.parse(data),
		}),
		getClearCutting: builder.query<ClearCutting, string>({
			query: (id) => `clear-cuttings/${id}`,
			transformResponse: (data) => clearCuttingSchema.parse(data),
		}),
		getClearCuttings: builder.query<
			ClearCuttingsResponse,
			Readonly<FiltersRequest>
		>({
			query: (filters) => ({ url: "clear-cuttings", params: filters }),
			transformResponse: (data) => clearCuttingsResponseSchema.parse(data),
		}),
	}),
});

export const { endpoints, useGetFiltersQuery, useGetClearCuttingQuery } =
	clearCuttingsApi;
export function useGetClearCuttingsQuery() {
	const filters = useAppSelector(selectFiltersRequest);
	return clearCuttingsApi.useGetClearCuttingsQuery(filters ?? skipToken);
}
