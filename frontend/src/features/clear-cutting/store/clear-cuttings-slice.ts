import type { FiltersRequest } from "@/features/clear-cutting/store/filters";
import { selectFiltersRequest } from "@/features/clear-cutting/store/filters.slice";
import type { Bounds } from "@/features/clear-cutting/store/types";
import type { RequestedContent } from "@/shared/api/types";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import {
	selectDepartmentsByIds,
	selectEcologicalZoningByIds,
	selectTagsByIds,
} from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { createAppAsyncThunk } from "@/shared/store/thunk";
import { createSlice } from "@reduxjs/toolkit";
import { useEffect } from "react";
import {
	type ClearCutForm,
	type ClearCutReport,
	type ClearCutReportResponse,
	type ClearCuttings,
	clearCutFormResponseSchema,
	clearCuttingsResponseSchema,
} from "./clear-cuttings";

const mapReport = (
	state: RootState,
	report: ClearCutReportResponse,
): ClearCutReport => ({
	...report,
	tags: selectTagsByIds(state, report.tags_ids),
	department: selectDepartmentsByIds(state, [report.department_id])[0],
	clear_cuts: report.clear_cuts.map((cut) => ({
		...cut,
		ecologicalZonings: selectEcologicalZoningByIds(
			state,
			cut.ecological_zoning_ids,
		),
	})),
});
export const getClearCutFormThunk = createAppAsyncThunk<ClearCutForm, string>(
	"getClearCutForm",
	async (id, { getState, extra: { api } }) => {
		const result = await api().get(`api/v1/clear-cuts-map/${id}`).json();
		const report = clearCutFormResponseSchema.parse(result);
		const state = getState();
		return mapReport(state, report) as ClearCutForm;
	},
);
const getClearCuttingsThunk = createAppAsyncThunk<
	ClearCuttings,
	FiltersRequest
>("getClearCuttings", async (filters, { getState, extra: { api } }) => {
	const searchParams = new URLSearchParams();
	for (const filter in filters) {
		const value = filters[filter as keyof FiltersRequest];
		if (filter === "geoBounds") {
			const geoBounds = filters[filter] as Bounds;
			searchParams.append("sw_lat", geoBounds.sw.lat.toString());
			searchParams.append("sw_lng", geoBounds.sw.lng.toString());
			searchParams.append("ne_lat", geoBounds.ne.lat.toString());
			searchParams.append("ne_lng", geoBounds.ne.lng.toString());
		} else if (Array.isArray(value)) {
			for (const v of value) {
				searchParams.append(filter, v.toString());
			}
		} else if (value !== undefined) {
			searchParams.append(filter, JSON.stringify(value));
		}
	}
	const result = await api()
		.get("api/v1/clear-cuts-map", {
			searchParams,
		})
		.json();
	const clearCuttings = clearCuttingsResponseSchema.parse(result);
	const state = getState();
	const previews = clearCuttings.previews.map((report) =>
		mapReport(state, report),
	) satisfies ClearCutReport[];
	return { ...clearCuttings, previews };
});
type State = {
	clearCuttings: RequestedContent<ClearCuttings>;
	detail: RequestedContent<ClearCutForm>;
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
		builder.addCase(getClearCutFormThunk.fulfilled, (state, { payload }) => {
			state.detail = { status: "success", value: payload };
		});
		builder.addCase(getClearCutFormThunk.rejected, (state, error) => {
			state.detail = { status: "error", error };
		});
		builder.addCase(getClearCutFormThunk.pending, (state) => {
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
		dispatch(getClearCutFormThunk(id));
	}, [id, dispatch]);
	return useAppSelector(selectDetail);
};
