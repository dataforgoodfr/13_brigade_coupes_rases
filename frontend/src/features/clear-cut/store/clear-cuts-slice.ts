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
		// Get the base report data
		const reportResult = await api().get(`api/v1/clear-cuts-map/${id}`).json();
		const report = clearCutFormResponseSchema.parse(reportResult);
		const state = getState();
		const baseReport = mapReport(state, report) as ClearCutForm;

		// Try to get the latest form data for this report
		try {
			const formsResult = await api()
				.get(`api/v1/clear-cuts-reports/${id}/forms`, {
					searchParams: { page: "0", size: "1" },
				})
				.json();

			// If forms exist, merge the latest form data with the base report
			const formsData = formsResult as { content?: unknown[] };
			if (formsData.content && formsData.content.length > 0) {
				const latestForm = formsData.content[0] as Record<string, unknown>;

				// Map backend form fields to frontend field names
				return {
					...baseReport,
					// On-site inspection fields
					onSiteDate: latestForm.inspection_date
						? (latestForm.inspection_date as string).split("T")[0]
						: undefined,
					weather: (latestForm.weather as string) || undefined,
					standTypeAndSilviculturalSystemBCC:
						(latestForm.forest_description as string) || undefined,
					isPlantationPresentACC: latestForm.remainingTrees as boolean,
					newTreeSpicies: (latestForm.species as string) || undefined,
					isWorksiteSignPresent: latestForm.workSignVisible as boolean,
					waterCourseOrWetlandPresence:
						(latestForm.waterzone_description as string) || undefined,
					protectedSpeciesDestructionIndex:
						(latestForm.protected_zone_description as string) || undefined,
					soilState: (latestForm.soil_state as string) || undefined,

					// Ecological zoning fields
					isNatura2000: latestForm.ecological_zone as boolean,
					ecoZoneType: (latestForm.ecological_zone_type as string) || undefined,
					isOtherEcoZone: Boolean(latestForm.ecological_zone_type),
					isNearEcoZone: latestForm.nearby_zone === "true",
					nearEcoZoneType: (latestForm.nearby_zone_type as string) || undefined,
					protectedSpeciesOnZone:
						(latestForm.protected_species as string) || undefined,
					protectedSpeciesHabitatOnZone:
						(latestForm.protected_habitats as string) || undefined,
					isDDT: latestForm.ddt_request as boolean,
					byWho: (latestForm.ddt_request_owner as string) || undefined,

					// Actors fields
					companyName: (latestForm.compagny as string) || undefined,
					subcontractor: (latestForm.subcontractor as string) || undefined,
					ownerName: (latestForm.landlord as string) || undefined, // This maps landlord -> ownerName

					// Regulations fields
					isCCOrCompanyCertified: latestForm.pefc_fsc_certified as boolean,
					isMoreThan20ha: latestForm.over_20_ha as boolean,
					isSubjectToPSG: latestForm.psg_required_plot as boolean,

					// Legal strategy fields
					isRelevantComplaintPEFC:
						latestForm.relevant_for_pefc_complaint as boolean,
					isRelevantComplaintREDIII:
						latestForm.relevant_for_rediii_complaint as boolean,
					isRelevantComplaintOFB:
						latestForm.relevant_for_ofb_complaint as boolean,
					isRelevantAlertSRGS:
						latestForm.relevant_for_alert_cnpf_ddt_srgs as boolean,
					isRelevantAlertPSG:
						latestForm.relevant_for_alert_cnpf_ddt_psg_thresholds as boolean,
					isRelevantRequestPSG: latestForm.relevant_for_psg_request as boolean,
					actionsUndertaken:
						(latestForm.request_engaged as string) || undefined,

					// Other fields
					otherInfos: (latestForm.other as string) || undefined,

					// Image fields (S3 keys)
					imgsClearCut: (latestForm.images_clear_cut as string[]) || undefined,
					imgsPlantation:
						(latestForm.images_plantation as string[]) || undefined,
					imgWorksiteSign:
						(latestForm.image_worksite_sign as string) || undefined,
					imgsTreeTrunks:
						(latestForm.images_tree_trunks as string[]) || undefined,
					imgsSoilState:
						(latestForm.images_soil_state as string[]) || undefined,
					imgsAccessRoad:
						(latestForm.images_access_road as string[]) || undefined,
				};
			}
		} catch (error) {
			// If no forms exist or error fetching, just return the base report
			console.info("No forms found for report, using base data");
		}

		return baseReport;
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

export const submitClearCutFormThunk = createAppAsyncThunk<
	void,
	{ reportId: string; formData: ClearCutForm }
>("submitClearCutForm", async ({ reportId, formData }, { extra: { api } }) => {
	// Map frontend field names to backend field names
	const backendFormData = {
		...formData,
		// On-site inspection fields
		inspection_date: formData.onSiteDate ? formData.onSiteDate : undefined,
		weather: formData.weather,
		forest_description: formData.standTypeAndSilviculturalSystemBCC,
		remainingTrees: formData.isPlantationPresentACC,
		species: formData.newTreeSpicies,
		workSignVisible: formData.isWorksiteSignPresent,
		waterzone_description: formData.waterCourseOrWetlandPresence,
		protected_zone_description: formData.protectedSpeciesDestructionIndex,
		soil_state: formData.soilState,

		// Ecological zoning fields
		ecological_zone: formData.isNatura2000,
		ecological_zone_type: formData.ecoZoneType,
		nearby_zone: formData.isNearEcoZone.toString(),
		nearby_zone_type: formData.nearEcoZoneType,
		protected_species: formData.protectedSpeciesOnZone,
		protected_habitats: formData.protectedSpeciesHabitatOnZone,
		ddt_request: formData.isDDT,
		ddt_request_owner: formData.byWho,

		// Actors fields
		compagny: formData.companyName, // Note: backend uses "compagny" (typo)
		subcontractor: formData.subcontractor,
		landlord: formData.ownerName,

		// Regulations fields
		pefc_fsc_certified: formData.isCCOrCompanyCertified,
		over_20_ha: formData.isMoreThan20ha,
		psg_required_plot: formData.isSubjectToPSG,

		// Legal strategy fields
		relevant_for_pefc_complaint: formData.isRelevantComplaintPEFC,
		relevant_for_rediii_complaint: formData.isRelevantComplaintREDIII,
		relevant_for_ofb_complaint: formData.isRelevantComplaintOFB,
		relevant_for_alert_cnpf_ddt_srgs: formData.isRelevantAlertSRGS,
		relevant_for_alert_cnpf_ddt_psg_thresholds: formData.isRelevantAlertPSG,
		relevant_for_psg_request: formData.isRelevantRequestPSG,
		request_engaged: formData.actionsUndertaken,

		// Other fields
		other: formData.otherInfos,

		// Image fields (S3 keys)
		images_clear_cut: formData.imgsClearCut,
		images_plantation: formData.imgsPlantation,
		image_worksite_sign: formData.imgWorksiteSign,
		images_tree_trunks: formData.imgsTreeTrunks,
		images_soil_state: formData.imgsSoilState,
		images_access_road: formData.imgsAccessRoad,

		// Remove frontend field names to avoid conflicts
		onSiteDate: undefined,
		standTypeAndSilviculturalSystemBCC: undefined,
		isPlantationPresentACC: undefined,
		newTreeSpicies: undefined,
		isWorksiteSignPresent: undefined,
		waterCourseOrWetlandPresence: undefined,
		protectedSpeciesDestructionIndex: undefined,
		soilState: undefined,
		isNatura2000: undefined,
		ecoZoneType: undefined,
		isNearEcoZone: undefined,
		nearEcoZoneType: undefined,
		protectedSpeciesOnZone: undefined,
		protectedSpeciesHabitatOnZone: undefined,
		isDDT: undefined,
		byWho: undefined,
		companyName: undefined,
		ownerName: undefined,
		isCCOrCompanyCertified: undefined,
		isMoreThan20ha: undefined,
		isSubjectToPSG: undefined,
		isRelevantComplaintPEFC: undefined,
		isRelevantComplaintREDIII: undefined,
		isRelevantComplaintOFB: undefined,
		isRelevantAlertSRGS: undefined,
		isRelevantAlertPSG: undefined,
		isRelevantRequestPSG: undefined,
		actionsUndertaken: undefined,
		otherInfos: undefined,
		imgsClearCut: undefined,
		imgsPlantation: undefined,
		imgWorksiteSign: undefined,
		imgsTreeTrunks: undefined,
		imgsSoilState: undefined,
		imgsAccessRoad: undefined,
	};

	await api()
		.post(`api/v1/clear-cuts-reports/${reportId}/forms`, {
			json: backendFormData,
		})
		.json();
});
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
		builder.addCase(submitClearCutFormThunk.fulfilled, (state) => {
			state.submission = { status: "success" };
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
