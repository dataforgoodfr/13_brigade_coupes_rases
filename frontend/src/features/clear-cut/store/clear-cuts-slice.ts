import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { isEqual, isUndefined, uniqBy } from "es-toolkit"
import { HTTPError, type KyInstance } from "ky"
import { useEffect, useRef } from "react"

import type { FiltersRequest } from "@/features/clear-cut/store/filters"
import { selectFiltersRequest } from "@/features/clear-cut/store/filters.slice"
import type { Bounds } from "@/features/clear-cut/store/types"
import { getMeThunk, selectConnectedMe } from "@/features/user/store/me.slice"
import { isNetworkError, parseParam } from "@/shared/api/api"
import {
	type EtagMismatchError,
	etagMismatchErrorSchema
} from "@/shared/api/errors"
import type { RequestedContent } from "@/shared/api/types"
import { useBreakpoint } from "@/shared/hooks/breakpoint"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"
import { localStorageRepository } from "@/shared/localStorage"
import { countPendingPhotos } from "@/shared/pendingPhotos"
import {
	selectDepartmentsByIds,
	selectEcologicalZoningByIds,
	selectRulesByIds
} from "@/shared/store/referential/referential.slice"
import { createTypedDraftSafeSelector } from "@/shared/store/selector"
import type { RootState } from "@/shared/store/store"
import {
	type AppThunk,
	addRequestedContentCases,
	createAppAsyncThunk,
	withEntityStorageActionCreator
} from "@/shared/store/thunk"

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
	type MultiPolygon,
	myAssignedReportsResponseSchema
} from "./clear-cuts"
import {
	clearFormPending,
	getPendingForms,
	setFormPending,
	withSendLock
} from "./pendingForms"

const formStorage =
	localStorageRepository<ClearCutFormVersions>("clear-cut-form")

/**
 * Stored forms are both drafts and the offline copy of the reports opened.
 * Keep unsent edits and the reports the user is assigned to (needed offline
 * in the field); the other reports opened in passing can go.
 */
export const keepStoredForm = (
	me: { id: string; favorites: string[] },
	id: string,
	versions: Pick<ClearCutFormVersions, "current" | "original">
) =>
	!isEqual(versions.current, versions.original) ||
	versions.current.report.userId === me.id ||
	me.favorites.includes(id)

const mapReport = (
	state: RootState,
	report: ClearCutReportResponse
): ClearCutReport => ({
	...report,
	// "Date de signalement" defaults to the report creation date until corrected.
	reportedAt: report.reportedAt ?? report.createdAt,
	rules: selectRulesByIds(state, report.rulesIds),
	department: selectDepartmentsByIds(state, [report.departmentId])[0],
	clearCuts: report.clearCuts.map((cut) => ({
		...cut,
		ecologicalZonings: selectEcologicalZoningByIds(
			state,
			cut.ecologicalZoningIds
		)
	}))
})

export const persistClearCutCurrentForm = createAppAsyncThunk<
	ClearCutForm | undefined,
	ClearCutForm
>("persistClearCutForm", async (form, { getState }) => {
	const versions = selectDetail(getState())
	if (isUndefined(versions.value)) {
		return
	}
	formStorage.setToLocalStorageById(form.report.id, {
		...versions.value,
		current: form
	})
	return form
})

type FormThunkApi = {
	getState: () => RootState
	extra: { api: () => KyInstance }
}

/**
 * The report from the server with its latest form, merged with the copy kept
 * on the device (unless `hasBeenCreated`: the server copy is then the truth).
 */
async function loadClearCutFormVersions(
	{ id, hasBeenCreated }: { id: string; hasBeenCreated?: boolean },
	{ getState, extra: { api } }: FormThunkApi
): Promise<ClearCutFormVersions> {
	// Get the base report data (full endpoint returns affectedUser/assignmentRequestedBy)
	const reportResult = await api().get(`api/v1/clear-cuts-reports/${id}`).json()
	const report = clearCutReportResponseSchema.parse(reportResult)
	const state = getState()
	const baseReport = mapReport(state, report)

	// Field forms are only served to connected accounts: a visitor sees the
	// report data, not the volunteer's notes
	const formsResult = selectConnectedMe(state)
		? clearCutFormsResponseSchema.parse(
				await api()
					.get(`api/v1/clear-cuts-reports/${id}/forms`, {
						searchParams: { page: "0", size: "1" }
					})
					.json()
			)
		: { content: [] }
	const ecologicalZonings = uniqBy(
		baseReport.clearCuts.flatMap((c) => c.ecologicalZonings),
		(e) => e.id
	)

	const computedProperties = {
		hasEcologicalZonings: ecologicalZonings.length > 0
	}
	let formReport: ClearCutForm
	// If forms exist, merge the latest form data with the base report
	if (formsResult.content && formsResult.content.length > 0) {
		const form = formsResult.content[0]
		formReport = {
			report: baseReport,
			...form,
			ecologicalZonings,
			...computedProperties
		}
	} else {
		formReport = clearCutFormSchema.parse({
			report: baseReport,
			reportId: baseReport.id,
			...computedProperties
		} as ClearCutForm)
	}

	const versions = formStorage.getFromLocalStorageById(
		formReport.report.id,
		clearCutFormVersionsSchema
	)

	// Always use the fresh report from the server (assignment status, userId, etc.)
	// while keeping user's locally-cached form field edits.
	const withFreshReport = (cached: ClearCutForm) => ({
		...cached,
		report: formReport.report
	})

	const form = (type: "current" | "original") => {
		if (hasBeenCreated) return formReport
		const cached = versions?.[type]
		return cached ? withFreshReport(cached) : formReport
	}
	const current = form("current")
	const differentFromLatest = current.etag !== formReport.etag
	const latest = differentFromLatest === true ? formReport : undefined

	return {
		original: form("original"),
		current,
		latest,
		versionMismatchDisclaimerShown:
			hasBeenCreated ?? (!differentFromLatest || isUndefined(versions))
	}
}

export const getClearCutFormThunk = createAppAsyncThunk<
	ClearCutFormVersions,
	{ id: string; hasBeenCreated?: boolean }
>(
	"getClearCutForm",
	withEntityStorageActionCreator(loadClearCutFormVersions, {
		getId: (v) => v.id,
		storage: formStorage,
		schema: clearCutFormVersionsSchema,
		type: "controlled"
	})
)

export const getClearCutsThunk = createAppAsyncThunk<ClearCuts, FiltersRequest>(
	"getClearCuts",
	async (filters, { getState, extra: { api } }) => {
		const searchParams = new URLSearchParams()
		for (const filter in filters) {
			const value = filters[filter as keyof FiltersRequest]
			if (filter === "geoBounds" && filters[filter] !== undefined) {
				const geoBounds = filters[filter] as Bounds
				searchParams.append("swLat", geoBounds.sw.lat.toString())
				searchParams.append("swLng", geoBounds.sw.lng.toString())
				searchParams.append("neLat", geoBounds.ne.lat.toString())
				searchParams.append("neLng", geoBounds.ne.lng.toString())
			} else if (
				(filter === "sortBy" || filter === "sortOrder") &&
				typeof value === "string"
			) {
				// Plain string params must be sent raw (parseParam would JSON-quote them)
				searchParams.append(filter, value)
			} else {
				parseParam(filter, value, searchParams)
			}
		}
		try {
			const result = await api()
				.get("api/v1/clear-cuts-map/", {
					searchParams
				})
				.json()
			const clearCuts = clearCutsResponseSchema.parse(result)
			const state = getState()
			const previews = clearCuts.previews.map((report) =>
				mapReport(state, report)
			) satisfies ClearCutReport[]
			return { ...clearCuts, previews }
		} catch (e) {
			if (isNetworkError(e)) {
				const forms = formStorage.getValuesFromStorage(
					clearCutFormVersionsSchema
				)
				const reports = forms.map((f) => f.current.report)
				return {
					previews: reports,
					points: {
						total: reports.length,
						content: reports.map((r) => ({
							count: 1,
							point: r.averageLocation
						}))
					}
				} satisfies ClearCuts
			} else {
				throw e
			}
		}
	}
)

export const submitClearCutFormThunk = createAppAsyncThunk<
	void,
	{ reportId: string; formData: ClearCutForm }
>(
	"submitClearCutForm",
	async ({ reportId, formData }, { extra: { api }, dispatch, getState }) => {
		const state = getState()
		const detail = selectDetail(state)
		try {
			await api()
				.post(`api/v1/clear-cuts-reports/${reportId}/forms`, {
					json: clearCutFormCreateSchema.parse(formData),
					headers: { etag: detail.value?.latest?.etag ?? formData.etag }
				})
				.json()
		} catch (e) {
			if (isNetworkError(e)) {
				// Kept on the device: sent as soon as the network is back
				setFormPending(reportId, "offline")
				throw e
			}
			if (
				e instanceof HTTPError &&
				e.response.status === 409 &&
				etagMismatchErrorSchema.safeParse(await e.response.json()).success
			) {
				dispatch(getClearCutFormThunk({ id: reportId, hasBeenCreated: false }))
			}
			throw e
		}

		await settlePendingForm(reportId)
		dispatch(getClearCutFormThunk({ id: reportId, hasBeenCreated: true }))
	}
)

/** Once a form reached the server, it only waits for its offline photos. */
async function settlePendingForm(reportId: string) {
	const photos = await countPendingPhotos(reportId).catch(() => 0)
	if (photos > 0) setFormPending(reportId, "photos")
	else clearFormPending(reportId)
}

/**
 * Send the forms saved without network. Each one is sent with the version it
 * was edited from: if someone saved a newer one meanwhile, the server refuses
 * it and the volunteer chooses when opening the report.
 */
export const sendPendingFormsThunk = createAppAsyncThunk<void, void>(
	"sendPendingForms",
	(_, thunkApi) =>
		withSendLock(async () => {
			const { getState, dispatch, extra } = thunkApi
			for (const [reportId, reason] of Object.entries(getPendingForms())) {
				// "photos": already sent, sent again once its photos have left;
				// "conflict": waits for the volunteer
				if (reason !== "offline") continue
				const versions = formStorage.getFromLocalStorageById(
					reportId,
					clearCutFormVersionsSchema
				)
				if (isUndefined(versions)) {
					clearFormPending(reportId)
					continue
				}
				try {
					await extra
						.api()
						.post(`api/v1/clear-cuts-reports/${reportId}/forms`, {
							json: clearCutFormCreateSchema.parse(versions.current),
							headers: { etag: versions.current.etag }
						})
						.json()
				} catch (e) {
					// Still no network: stop, the next "online" event will retry
					if (isNetworkError(e)) return
					if (e instanceof HTTPError && e.response.status === 409) {
						setFormPending(reportId, "conflict")
					}
					// Other refusals (locked form, lost assignment) stay flagged
					continue
				}
				await settlePendingForm(reportId)
				// Replace the device copy by the version just created
				if (selectDetail(getState()).value?.current.report.id === reportId) {
					dispatch(getClearCutFormThunk({ id: reportId, hasBeenCreated: true }))
				} else {
					const fresh = await loadClearCutFormVersions(
						{ id: reportId, hasBeenCreated: true },
						thunkApi
					).catch(() => undefined)
					if (fresh) formStorage.setToLocalStorageById(reportId, fresh)
				}
			}
		})
)

export const getMyAssignedReportsThunk = createAppAsyncThunk<
	{ content: ClearCutReport[]; totalCount: number },
	{ page: number; size: number }
>(
	"getMyAssignedReports",
	async ({ page, size }, { getState, extra: { api } }) => {
		let result: unknown
		try {
			result = await api()
				.get("api/v1/clear-cuts-reports/", {
					searchParams: { page, size, assigned_to_me: true }
				})
				.json()
		} catch (e) {
			if (!isNetworkError(e)) throw e
			// Offline: the reports kept on the device that are assigned to me
			const me = selectConnectedMe(getState())
			const content = formStorage
				.getValuesFromStorage(clearCutFormVersionsSchema)
				.map((f) => f.current.report)
				.filter((report) => !!me && report.userId === me.id)
			return { content, totalCount: content.length }
		}
		const parsed = myAssignedReportsResponseSchema.parse(result)
		const state = getState()
		const reports = parsed.content.map((report) => mapReport(state, report))
		return {
			content: reports,
			totalCount: parsed.metadata.totalCount
		}
	}
)

export const getAdminActionRequiredReportsThunk = createAppAsyncThunk<
	{ content: ClearCutReport[]; totalCount: number },
	{ page: number; size: number }
>(
	"getAdminActionRequiredReports",
	async ({ page, size }, { getState, extra: { api } }) => {
		const result = await api()
			.get("api/v1/clear-cuts-reports/", {
				searchParams: { page, size, admin_action_required: true }
			})
			.json()
		const parsed = myAssignedReportsResponseSchema.parse(result)
		const state = getState()
		const reports = parsed.content.map((report) => mapReport(state, report))
		return {
			content: reports,
			totalCount: parsed.metadata.totalCount
		}
	}
)

export const getAdminAllReportsThunk = createAppAsyncThunk<
	{ content: ClearCutReport[]; totalCount: number },
	{ page: number; size: number }
>(
	"getAdminAllReports",
	async ({ page, size }, { getState, extra: { api } }) => {
		const result = await api()
			.get("api/v1/clear-cuts-reports/", {
				searchParams: { page, size }
			})
			.json()
		const parsed = myAssignedReportsResponseSchema.parse(result)
		const state = getState()
		const reports = parsed.content.map((report) => mapReport(state, report))
		return {
			content: reports,
			totalCount: parsed.metadata.totalCount
		}
	}
)

/** Action produite par un thunk de workflow une fois dispatché, quel que soit son argument. */
export type WorkflowThunkAction<Arg = unknown> = ReturnType<AppThunk<void, Arg>>

export const requestAssignReportThunk = createAppAsyncThunk<void, string>(
	"requestAssignReport",
	async (reportId, { extra: { api } }) => {
		await api()
			.post(`api/v1/clear-cuts-reports/${reportId}/request-assignment`)
			.json()
	}
)

export const cancelAssignRequestThunk = createAppAsyncThunk<void, string>(
	"cancelAssignRequest",
	async (reportId, { extra: { api } }) => {
		await api()
			.post(`api/v1/clear-cuts-reports/${reportId}/cancel-request`)
			.json()
	}
)

export const approveAssignmentThunk = createAppAsyncThunk<void, string>(
	"approveAssignment",
	async (reportId, { extra: { api } }) => {
		await api()
			.post(`api/v1/clear-cuts-reports/${reportId}/approve-assignment`)
			.json()
	}
)

export const rejectAssignmentThunk = createAppAsyncThunk<void, string>(
	"rejectAssignment",
	async (reportId, { extra: { api } }) => {
		await api()
			.post(`api/v1/clear-cuts-reports/${reportId}/reject-assignment`)
			.json()
	}
)

export const unassignReportThunk = createAppAsyncThunk<void, string>(
	"clear-cuts/unassign",
	async (id, { extra: { api } }) =>
		await api().post(`api/v1/clear-cuts-reports/${id}/unassign`).json()
)

export const updateReportStatusThunk = createAppAsyncThunk<
	void,
	{ id: string; status: string }
>("clear-cuts/updateStatus", async ({ id, status }, { extra: { api } }) => {
	await api().put(`api/v1/clear-cuts-reports/${id}`, { json: { status } })
})

export const volunteerValidateThunk = createAppAsyncThunk<void, string>(
	"clear-cuts/volunteerValidate",
	async (reportId, { extra: { api }, dispatch }) => {
		await api()
			.post(`api/v1/clear-cuts-reports/${reportId}/volunteer-validate`)
			.json()
		dispatch(getClearCutFormThunk({ id: reportId, hasBeenCreated: true }))
	}
)

export const approveValidationThunk = createAppAsyncThunk<void, string>(
	"clear-cuts/approveValidation",
	async (reportId, { extra: { api }, dispatch }) => {
		await api()
			.post(`api/v1/clear-cuts-reports/${reportId}/approve-validation`)
			.json()
		dispatch(getClearCutFormThunk({ id: reportId }))
	}
)

export const rejectValidationThunk = createAppAsyncThunk<void, string>(
	"clear-cuts/rejectValidation",
	async (reportId, { extra: { api }, dispatch }) => {
		await api()
			.post(`api/v1/clear-cuts-reports/${reportId}/reject-validation`)
			.json()
		dispatch(getClearCutFormThunk({ id: reportId }))
	}
)

export const reopenReportThunk = createAppAsyncThunk<void, string>(
	"clear-cuts/reopen",
	async (reportId, { extra: { api } }) =>
		await api().post(`api/v1/clear-cuts-reports/${reportId}/reopen`).json()
)

export const updateClearCutGeometryThunk = createAppAsyncThunk<
	void,
	{
		reportId: string
		clearCutId: string
		boundary?: MultiPolygon
		observationStartDate?: string
		observationEndDate?: string
	}
>(
	"clear-cuts/updateGeometry",
	async (
		{
			reportId,
			clearCutId,
			boundary,
			observationStartDate,
			observationEndDate
		},
		{ extra: { api }, dispatch }
	) => {
		const json: Record<string, unknown> = {}
		if (boundary !== undefined) json.boundary = boundary
		if (observationStartDate !== undefined)
			json.observationStartDate = observationStartDate
		if (observationEndDate !== undefined)
			json.observationEndDate = observationEndDate
		await api().patch(`api/v1/clear-cuts/${clearCutId}`, { json }).json()
		dispatch(getClearCutFormThunk({ id: reportId, hasBeenCreated: true }))
	}
)

export const updateReportInfoThunk = createAppAsyncThunk<
	void,
	{ reportId: string; reportedAt?: string; cityZipCode?: string }
>(
	"clear-cuts/updateReportInfo",
	async (
		{ reportId, reportedAt, cityZipCode },
		{ extra: { api }, dispatch }
	) => {
		const json: Record<string, unknown> = {}
		if (reportedAt !== undefined) json.reportedAt = reportedAt
		if (cityZipCode !== undefined) json.cityZipCode = cityZipCode
		await api().put(`api/v1/clear-cuts-reports/${reportId}`, { json })
		dispatch(getClearCutFormThunk({ id: reportId, hasBeenCreated: true }))
	}
)

export const setPipelineOverrideThunk = createAppAsyncThunk<
	void,
	{ reportId: string; allow: boolean }
>(
	"clear-cuts/setPipelineOverride",
	async ({ reportId, allow }, { extra: { api }, dispatch }) => {
		await api()
			.post(`api/v1/clear-cuts-reports/${reportId}/pipeline-override`, {
				json: { allow }
			})
			.json()
		dispatch(getClearCutFormThunk({ id: reportId, hasBeenCreated: true }))
	}
)

type State = {
	clearCuts: RequestedContent<ClearCuts>
	detail: RequestedContent<ClearCutFormVersions>
	submission: RequestedContent<void, EtagMismatchError>
	myAssignedReports: RequestedContent<{
		content: ClearCutReport[]
		totalCount: number
	}>
	adminActionRequiredReports: RequestedContent<{
		content: ClearCutReport[]
		totalCount: number
	}>
	adminAllReports: RequestedContent<{
		content: ClearCutReport[]
		totalCount: number
	}>
	assignation: RequestedContent<void, string>
	// Manual corrections of a report (info, perimeter, pipeline lock); kept apart
	// from `assignation` so the assignment toasts do not fire on an edition.
	edition: RequestedContent<void, string>
}

const initialState: State = {
	clearCuts: { status: "idle" },
	detail: { status: "idle" },
	submission: { status: "idle" },
	myAssignedReports: { status: "idle" },
	adminActionRequiredReports: { status: "idle" },
	adminAllReports: { status: "idle" },
	assignation: { status: "idle" },
	edition: { status: "idle" }
}

export const clearCutsSlice = createSlice({
	name: "clearCuts",
	initialState,
	reducers: {
		addToFavorites: (state, action: PayloadAction<{ id: string }>) => {
			localStorage.setItem(
				`clear-cut:${action.payload.id}`,
				JSON.stringify(state.detail)
			)
		},
		replaceCurrentVersionByLatest: (state) => {
			if (
				!isUndefined(state.detail.value?.current) &&
				!isUndefined(state.detail.value?.original) &&
				!isUndefined(state.detail.value?.latest)
			) {
				state.detail.value.current = state.detail.value?.latest
				state.detail.value.original = state.detail.value?.latest
				state.detail.value.versionMismatchDisclaimerShown = true
			}
		}
	},
	extraReducers: (builder) => {
		addRequestedContentCases(
			builder,
			getClearCutFormThunk,
			(state) => state.detail
		)
		addRequestedContentCases(
			builder,
			getClearCutsThunk,
			(state) => state.clearCuts
		)
		addRequestedContentCases(
			builder,
			submitClearCutFormThunk,
			(state) => state.submission
		)
		addRequestedContentCases(
			builder,
			getMyAssignedReportsThunk,
			(state) => state.myAssignedReports
		)
		addRequestedContentCases(
			builder,
			getAdminActionRequiredReportsThunk,
			(state) => state.adminActionRequiredReports
		)
		addRequestedContentCases(
			builder,
			getAdminAllReportsThunk,
			(state) => state.adminAllReports
		)
		addRequestedContentCases(
			builder,
			requestAssignReportThunk,
			(state) => state.assignation
		)
		addRequestedContentCases(
			builder,
			cancelAssignRequestThunk,
			(state) => state.assignation
		)
		addRequestedContentCases(
			builder,
			approveAssignmentThunk,
			(state) => state.assignation
		)
		addRequestedContentCases(
			builder,
			rejectAssignmentThunk,
			(state) => state.assignation
		)
		addRequestedContentCases(
			builder,
			unassignReportThunk,
			(state) => state.assignation
		)
		addRequestedContentCases(
			builder,
			updateReportStatusThunk,
			(state) => state.assignation
		)
		addRequestedContentCases(
			builder,
			volunteerValidateThunk,
			(state) => state.assignation
		)
		addRequestedContentCases(
			builder,
			approveValidationThunk,
			(state) => state.assignation
		)
		addRequestedContentCases(
			builder,
			rejectValidationThunk,
			(state) => state.assignation
		)
		addRequestedContentCases(
			builder,
			reopenReportThunk,
			(state) => state.assignation
		)
		addRequestedContentCases(
			builder,
			updateClearCutGeometryThunk,
			(state) => state.edition
		)
		addRequestedContentCases(
			builder,
			updateReportInfoThunk,
			(state) => state.edition
		)
		addRequestedContentCases(
			builder,
			setPipelineOverrideThunk,
			(state) => state.edition
		)
		builder.addCase(getMeThunk.fulfilled, (_, { payload: me }) => {
			// Offline, the stored profile carries no id: keep everything
			if (!("id" in me)) return
			formStorage.pruneStorage(
				(id, versions) => keepStoredForm(me, id, versions),
				clearCutFormVersionsSchema
			)
		})
	}
})

const selectState = (state: RootState) => state.clearCuts

export const selectDetail = createTypedDraftSafeSelector(
	selectState,
	(state) => state.detail
)

export const selectClearCuts = createTypedDraftSafeSelector(
	selectState,
	(state) => state.clearCuts
)

export const selectMyAssignedReports = createTypedDraftSafeSelector(
	selectState,
	(state) => state.myAssignedReports
)

export const selectSubmission = createTypedDraftSafeSelector(
	selectState,
	(state) => state.submission
)

export const selectAdminAllReports = createTypedDraftSafeSelector(
	selectState,
	(state) => state.adminAllReports
)

export const selectAdminActionRequiredReports = createTypedDraftSafeSelector(
	selectState,
	(state) => state.adminActionRequiredReports
)

export const selectAssignation = createTypedDraftSafeSelector(
	selectState,
	(state) => state.assignation
)

export const useGetClearCuts = () => {
	const filters = useAppSelector(selectFiltersRequest)
	const dispatch = useAppDispatch()
	const { breakpoint } = useBreakpoint()
	const ref = useRef<NodeJS.Timeout | undefined>(undefined)
	useEffect(() => {
		clearTimeout(ref.current)
		if ((breakpoint === "mobile" && filters) || filters?.geoBounds) {
			// Debounce to avoid multiple calls when dragging, resizing, or zooming the map
			ref.current = setTimeout(() => {
				dispatch(getClearCutsThunk(filters))
				clearTimeout(ref.current)
			}, 100)
		}
	}, [filters, breakpoint, dispatch])
}

export const useGetClearCut = (id: string) => {
	const dispatch = useAppDispatch()
	useEffect(() => {
		dispatch(getClearCutFormThunk({ id }))
	}, [id, dispatch])
	return useAppSelector(selectDetail)
}
