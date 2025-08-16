import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { uniqBy } from "es-toolkit";
import { useEffect } from "react";
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
import {
	type ClearCutForm,
	type ClearCutReport,
	type ClearCutReportResponse,
	type ClearCuts,
	clearCutFormSchema,
	clearCutFormsResponseSchema,
	clearCutReportResponseSchema,
	clearCutsResponseSchema,
} from "./clear-cuts";

const mapReport = (
	state: RootState,
	report: ClearCutReportResponse,
): ClearCutReport => ({
	...report,
	rules: selectRulesByIds(state, report.rulesIds),
	department: selectDepartmentsByIds(state, [report.departmentId])[0],
	clearCuts: report.clearCuts.map((cut) => ({
		...cut,
		ecologicalZonings: selectEcologicalZoningByIds(
			state,
			cut.ecologicalZoningIds,
		),
	})),
});
export const getClearCutFormThunk = createAppAsyncThunk<ClearCutForm, string>(
	"getClearCutForm",
	async (id, { getState, extra: { api } }) => {
		// Get the base report data
		const reportResult = await api().get(`api/v1/clear-cuts-map/${id}`).json();
		const report = clearCutReportResponseSchema.parse(reportResult);
		const state = getState();
		const baseReport = mapReport(state, report);

		const formsResult = clearCutFormsResponseSchema.parse(
			await api()
				.get(`api/v1/clear-cuts-reports/${id}/forms`, {
					searchParams: { page: "0", size: "1" },
				})
				.json(),
		);
		const ecologicalZonings = uniqBy(
			baseReport.clearCuts.flatMap((c) => c.ecologicalZonings),
			(e) => e.id,
		);

		const computedProperties = {
			hasEcologicalZonings: ecologicalZonings.length > 0,
		};
		// If forms exist, merge the latest form data with the base report
		if (formsResult.content && formsResult.content.length > 0) {
			const form = formsResult.content[0];
			return {
				report: baseReport,
				...form,
				ecologicalZonings,
				...computedProperties,
			};
		}
		return clearCutFormSchema.parse({
			report: baseReport,
			...computedProperties,
		});
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
				searchParams.append("swLat", geoBounds.sw.lat.toString());
				searchParams.append("swLng", geoBounds.sw.lng.toString());
				searchParams.append("neLat", geoBounds.ne.lat.toString());
				searchParams.append("neLng", geoBounds.ne.lng.toString());
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

export const submitClearCutFormThunk = createAppAsyncThunk<
	void,
	{ reportId: string; formData: ClearCutForm }
>(
	"submitClearCutForm",
	async ({ reportId, formData }, { extra: { api }, dispatch }) => {
		await api()
			.post(`api/v1/clear-cuts-reports/${reportId}/forms`, {
				json: formData,
			})
			.json();
		dispatch(getClearCutFormThunk(reportId));
	},
);
type State = {
	clearCuts: RequestedContent<ClearCuts>;
	detail: RequestedContent<ClearCutForm>;
	submission: RequestedContent<void>;
};
const initialState: State = {
	clearCuts: { status: "idle" },
	detail: { status: "idle" },
	submission: { status: "idle" },
};
export const clearCutsSlice = createSlice({
	name: "clearCuts",
	initialState,
	reducers: {
		addToFavorites: (state, action: PayloadAction<{ id: string }>) => {
			localStorage.setItem(
				`clear-cut:${action.payload.id}`,
				JSON.stringify(state.detail),
			);
		},
	},
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
		builder.addCase(submitClearCutFormThunk.rejected, (state, error) => {
			state.submission = { status: "error", error };
		});
		builder.addCase(submitClearCutFormThunk.pending, (state) => {
			state.submission = { status: "loading" };
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
export const selectSubmission = createTypedDraftSafeSelector(
	selectState,
	(state) => state.submission,
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
