import type { FiltersRequest } from "@/features/clear-cut/store/filters";
import { selectFiltersRequest } from "@/features/clear-cut/store/filters.slice";
import type { Bounds } from "@/features/clear-cut/store/types";
import { parseParam } from "@/shared/api/api";
import type { RequestedContent } from "@/shared/api/types";
import { useBreakpoint } from "@/shared/hooks/breakpoint";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import {
	selectDepartmentsByIds,
	selectEcologicalZoningByIds,
	selectRulesByIds,
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
	type ClearCuts,
	clearCutFormResponseSchema,
	clearCutsResponseSchema,
} from "./clear-cuts";

const mapReport = (
	state: RootState,
	report: ClearCutReportResponse,
): ClearCutReport => ({
	...report,
	rules: selectRulesByIds(state, report.rules_ids),
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
const getClearCutsThunk = createAppAsyncThunk<ClearCuts, FiltersRequest>(
	"getClearCuts",
	async (filters, { getState, extra: { api } }) => {
		const searchParams = new URLSearchParams();
		for (const filter in filters) {
			const value = filters[filter as keyof FiltersRequest];
			if (filter === "geoBounds" && filters[filter] !== undefined) {
				const geoBounds = filters[filter] as Bounds;
				searchParams.append("sw_lat", geoBounds.sw.lat.toString());
				searchParams.append("sw_lng", geoBounds.sw.lng.toString());
				searchParams.append("ne_lat", geoBounds.ne.lat.toString());
				searchParams.append("ne_lng", geoBounds.ne.lng.toString());
			} else {
				parseParam(filter, value, searchParams);
			}
		}
		const result = await api()
			.get("api/v1/clear-cuts-map", {
				searchParams,
			})
			.json();
		const clearCuts = clearCutsResponseSchema.parse(result);
		const state = getState();
		const previews = clearCuts.previews.map((report) =>
			mapReport(state, report),
		) satisfies ClearCutReport[];
		return { ...clearCuts, previews };
	},
);
type State = {
	clearCuts: RequestedContent<ClearCuts>;
	detail: RequestedContent<ClearCutForm>;
};
const initialState: State = {
	clearCuts: { status: "idle" },
	detail: { status: "idle" },
};
export const clearCutsSlice = createSlice({
	name: "clearCuts",
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
		builder.addCase(getClearCutsThunk.fulfilled, (state, { payload }) => {
			state.clearCuts = { status: "success", value: payload };
		});
		builder.addCase(getClearCutsThunk.rejected, (state, error) => {
			state.clearCuts = { status: "error", error };
		});
		builder.addCase(getClearCutsThunk.pending, (state) => {
			state.clearCuts = { status: "loading" };
		});
	},
});

const selectState = (state: RootState) => state.clearCuts;
export const selectDetail = createTypedDraftSafeSelector(
	selectState,
	(state) => state.detail,
);
export const selectClearCuts = createTypedDraftSafeSelector(
	selectState,
	(state) => state.clearCuts,
);
export const useGetClearCuts = () => {
	const filters = useAppSelector(selectFiltersRequest);
	const dispatch = useAppDispatch();
	const { breakpoint } = useBreakpoint();
	useEffect(() => {
		if ((breakpoint === "mobile" && filters) || filters?.geoBounds) {
			dispatch(getClearCutsThunk(filters));
		}
	}, [filters, breakpoint, dispatch]);
};

export const useGetClearCut = (id: string) => {
	const dispatch = useAppDispatch();
	useEffect(() => {
		dispatch(getClearCutFormThunk(id));
	}, [id, dispatch]);
	return useAppSelector(selectDetail);
};
