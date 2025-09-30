import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { isUndefined, uniqBy } from "es-toolkit";
import { HTTPError } from "ky";
import { useEffect } from "react";
import type { FiltersRequest } from "@/features/clear-cut/store/filters";
import { selectFiltersRequest } from "@/features/clear-cut/store/filters.slice";
import type { Bounds } from "@/features/clear-cut/store/types";
import { getMeThunk } from "@/features/user/store/me.slice";
import { isNetworkError, parseParam } from "@/shared/api/api";
import {
	type EtagMismatchError,
	etagMismatchErrorSchema,
} from "@/shared/api/errors";
import type { RequestedContent } from "@/shared/api/types";
import { useBreakpoint } from "@/shared/hooks/breakpoint";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { localStorageRepository } from "@/shared/localStorage";
import {
	selectDepartmentsByIds,
	selectEcologicalZoningByIds,
	selectRulesByIds,
} from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import {
	addRequestedContentCases,
	createAppAsyncThunk,
	withEntityStorageActionCreator,
} from "@/shared/store/thunk";
import {
	type ClearCutForm,
	type ClearCutFormVersions,
	type ClearCutReport,
	type ClearCutReportResponse,
	type ClearCuts,
	clearCutFormCreateSchema,
	clearCutFormSchema,
	clearCutFormsResponseSchema,
	clearCutFormVersionsSchema,
	clearCutReportResponseSchema,
	clearCutsResponseSchema,
} from "./clear-cuts";

const formStorage =
	localStorageRepository<ClearCutFormVersions>("clear-cut-form");

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

export const persistClearCutCurrentForm = createAppAsyncThunk<
	ClearCutForm | undefined,
	ClearCutForm
>("persistClearCutForm", async (form, { getState }) => {
	const versions = selectDetail(getState());
	if (isUndefined(versions.value)) {
		return;
	}
	formStorage.setToLocalStorageById(form.report.id, {
		...versions.value,
		current: form,
	});
	return form;
});

export const getClearCutFormThunk = createAppAsyncThunk<
	ClearCutFormVersions,
	{ id: string; hasBeenCreated?: boolean }
>(
	"getClearCutForm",
	withEntityStorageActionCreator(
		async ({ id, hasBeenCreated }, { getState, extra: { api } }) => {
			// Get the base report data
			const reportResult = await api()
				.get(`api/v1/clear-cuts-map/${id}`)
				.json();
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
			let formReport: ClearCutForm;
			// If forms exist, merge the latest form data with the base report
			if (formsResult.content && formsResult.content.length > 0) {
				const form = formsResult.content[0];
				formReport = {
					report: baseReport,
					...form,
					ecologicalZonings,
					...computedProperties,
				};
			} else {
				formReport = clearCutFormSchema.parse({
					report: baseReport,
					reportId: baseReport.id,
					...computedProperties,
				} as ClearCutForm);
			}
			const versions = formStorage.getFromLocalStorageById(
				formReport.report.id,
				clearCutFormVersionsSchema,
			);

			const form = (type: "current" | "original") =>
				hasBeenCreated ? formReport : (versions?.[type] ?? formReport);
			const current = form("current");
			const differentFromLatest = current.etag !== formReport.etag;

			return {
				original: form("original"),
				current,
				latest: differentFromLatest === true ? formReport : undefined,
				versionMismatchDisclaimerShown:
					hasBeenCreated ?? (!differentFromLatest || isUndefined(versions)),
			};
		},
		{
			getId: (v) => v.id,
			storage: formStorage,
			schema: clearCutFormVersionsSchema,
			type: "controlled",
		},
	),
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
		try {
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
		} catch (e) {
			if (isNetworkError(e)) {
				const forms = formStorage.getValuesFromStorage(
					clearCutFormVersionsSchema,
				);
				const reports = forms.map((f) => f.current.report);
				return {
					previews: reports,
					points: {
						total: reports.length,
						content: reports.map((r) => ({
							count: 1,
							point: r.averageLocation,
						})),
					},
				} satisfies ClearCuts;
			} else {
				throw e;
			}
		}
	},
);

export const submitClearCutFormThunk = createAppAsyncThunk<
	void,
	{ reportId: string; formData: ClearCutForm }
>(
	"submitClearCutForm",
	async ({ reportId, formData }, { extra: { api }, dispatch, getState }) => {
		const state = getState();
		const detail = selectDetail(state);
		try {
			await api()
				.post(`api/v1/clear-cuts-reports/${reportId}/forms`, {
					json: clearCutFormCreateSchema.parse(formData),
					headers: { etag: detail.value?.latest?.etag ?? formData.etag },
				})
				.json();
		} catch (e) {
			if (
				e instanceof HTTPError &&
				e.response.status === 409 &&
				etagMismatchErrorSchema.safeParse(await e.response.json()).success
			) {
				dispatch(getClearCutFormThunk({ id: reportId, hasBeenCreated: false }));
			}
			throw e;
		}

		dispatch(getClearCutFormThunk({ id: reportId, hasBeenCreated: true }));
	},
);
type State = {
	clearCuts: RequestedContent<ClearCuts>;
	detail: RequestedContent<ClearCutFormVersions>;
	submission: RequestedContent<void, EtagMismatchError>;
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
		replaceCurrentVersionByLatest: (state) => {
			if (
				!isUndefined(state.detail.value?.current) &&
				!isUndefined(state.detail.value?.original) &&
				!isUndefined(state.detail.value?.latest)
			) {
				state.detail.value.current = state.detail.value?.latest;
				state.detail.value.original = state.detail.value?.latest;
				state.detail.value.versionMismatchDisclaimerShown = true;
			}
		},
	},
	extraReducers: (builder) => {
		addRequestedContentCases(
			builder,
			getClearCutFormThunk,
			(state) => state.detail,
		);
		addRequestedContentCases(
			builder,
			getClearCutsThunk,
			(state) => state.clearCuts,
		);
		addRequestedContentCases(
			builder,
			submitClearCutFormThunk,
			(state) => state.submission,
		);
		builder.addCase(getMeThunk.fulfilled, (_, { payload: { favorites } }) => {
			formStorage.syncStorage(favorites, clearCutFormVersionsSchema);
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
		dispatch(getClearCutFormThunk({ id }));
	}, [id, dispatch]);
	return useAppSelector(selectDetail);
};
