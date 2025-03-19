import {
	type FiltersState,
	initialState,
} from "@/features/clear-cutting/store/filters.slice";

export const filtersState = {
	geoBounds: { sw: { lat: 11, lng: 11 }, ne: { lat: 22, lng: 22 } },
	...initialState,
} as FiltersState;
