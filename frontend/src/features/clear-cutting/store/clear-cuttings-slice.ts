import type { FiltersRequest } from "@/features/clear-cutting/store/filters";
import { selectFiltersRequest } from "@/features/clear-cutting/store/filters.slice";
import type { Bounds } from "@/features/clear-cutting/store/types";
import type { RequestedContent } from "@/shared/api/types";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import {
	selectStatusesByIds,
	selectTagsByIds,
} from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { createAppAsyncThunk } from "@/shared/store/thunk";
import { createSlice } from "@reduxjs/toolkit";
import { useEffect } from "react";
import {
	type ClearCutting,
	type ClearCuttings,
	clearCuttingResponseSchema,
	clearCuttingsResponseSchema,
} from "./clear-cuttings";

export const getClearCuttingThunk = createAppAsyncThunk<ClearCutting, string>(
	"getClearCutting",
	async (id, { getState, extra: { api } }) => {
		const result = await api().get(`clear-cuttings/${id}`).json();
		const clearCutting = clearCuttingResponseSchema.parse(result);
		const state = getState();
		const tags = selectTagsByIds(state, clearCutting.tags);
		const status = selectStatusesByIds(state, [clearCutting.status])[0];
		return {
			...clearCutting,
			abusiveTags: tags,
			status,
		};
	},
);
const getClearCuttingsThunk = createAppAsyncThunk<
	ClearCuttings,
	FiltersRequest
>("getClearCuttings", async (filters, { getState, extra: { api } }) => {
	const result = await api()
		.get("api/v1/clearcuts-map", {
			searchParams: new URLSearchParams(
				Object.entries(filters).reduce(
					(acc, [key, value]) => {
						if (key === "geoBounds") {
							const geoBounds = value as Bounds;
							acc.swLat = geoBounds.sw.lat.toString();
							acc.swLng = geoBounds.sw.lng.toString();
							acc.neLat = geoBounds.ne.lat.toString();
							acc.neLng = geoBounds.ne.lng.toString();
						} else if (Array.isArray(value)) {
							if (value.length > 0) {
								acc[key] = value.join(",");
							}
						} else {
							acc[key] = JSON.stringify(value);
						}
						return acc;
					},
					{} as Record<string, string>,
				),
			),
		})
		.json();
	console.log(result);
	const clearCuttings = clearCuttingsResponseSchema.parse(result);
	console.log(clearCuttings);
	const state = getState();
	const clearCuttingPreviews = clearCuttings.previews.map((preview) => ({
		...preview,
		abusiveTags: selectTagsByIds(state, preview.tags),
		status: selectStatusesByIds(state, [preview.status])[0],
	}));
	return { ...clearCuttings, clearCuttingPreviews };
});
type State = {
	clearCuttings: RequestedContent<ClearCuttings>;
	detail: RequestedContent<ClearCutting>;
};
const initialState: State = {
	clearCuttings: { status: "idle" },
	detail: { status: "idle" },
};
export const clearCuttingsSlice = createSlice({
	name: "clearCuttings",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(getClearCuttingThunk.fulfilled, (state, { payload }) => {
			state.detail = { status: "success", value: payload };
		});
		builder.addCase(getClearCuttingThunk.rejected, (state, error) => {
			state.detail = { status: "error", error };
		});
		builder.addCase(getClearCuttingThunk.pending, (state) => {
			state.detail = { status: "loading" };
		});
		builder.addCase(getClearCuttingsThunk.fulfilled, (state, { payload }) => {
			state.clearCuttings = { status: "success", value: payload };
		});
		builder.addCase(getClearCuttingsThunk.rejected, (state, error) => {
			state.clearCuttings = { status: "error", error };
		});
		builder.addCase(getClearCuttingsThunk.pending, (state) => {
			state.clearCuttings = { status: "loading" };
		});
	},
});

const selectState = (state: RootState) => state.clearCuttings;
export const selectDetail = createTypedDraftSafeSelector(
	selectState,
	(state) => state.detail,
);
export const selectClearCuttings = createTypedDraftSafeSelector(
	selectState,
	(state) => state.clearCuttings,
);
export const useGetClearCuttings = () => {
	const filters = useAppSelector(selectFiltersRequest);
	const dispatch = useAppDispatch();
	useEffect(() => {
		if (filters) {
			dispatch(getClearCuttingsThunk(filters));
		}
	}, [filters, dispatch]);
};

export const useGetClearCutting = (id: string) => {
	const dispatch = useAppDispatch();
	useEffect(() => {
		dispatch(getClearCuttingThunk(id));
	}, [id, dispatch]);
	return useAppSelector(selectDetail);
};
