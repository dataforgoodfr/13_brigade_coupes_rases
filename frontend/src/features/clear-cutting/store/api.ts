import type { FiltersRequest } from "@/features/clear-cutting/store/filters";
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

export const clearCuttingsApi = createApi({
	reducerPath: "api/clearCuttings",
	baseQuery: fetchBaseQuery({
		baseUrl: `${import.meta.env.VITE_API}`,
	}),
	endpoints: (builder) => ({
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

export const { endpoints, useGetClearCuttingQuery } = clearCuttingsApi;
export function useGetClearCuttingsQuery() {
	const filters = useAppSelector(selectFiltersRequest);
	return clearCuttingsApi.useGetClearCuttingsQuery(filters ?? skipToken);
}
