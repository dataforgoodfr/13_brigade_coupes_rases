import { createSlice } from "@reduxjs/toolkit"

import type { RequiredRequestedContent } from "@/shared/api/types"
import type { ItemFromRecord } from "@/shared/array"
import { useAppSelector } from "@/shared/hooks/store"
import type { NamedId, SelectableItem } from "@/shared/items"
import {
	type ReferentialResponse,
	referentialSchemaResponse
} from "@/shared/store/referential/referential"
import { createTypedDraftSafeSelector } from "@/shared/store/selector"
import type { RootState } from "@/shared/store/store"
import { createAppAsyncThunk } from "@/shared/store/thunk"

export const getReferentialThunk = createAppAsyncThunk(
	"referential/get",
	async (_, { extra: { api } }) => {
		const result = await api()
			.get<ReferentialResponse>("api/v1/referential/")
			.json()
		return referentialSchemaResponse.parse(result)
	}
)
type State = RequiredRequestedContent<Required<ReferentialResponse>>
const initialState: State = {
	status: "idle",
	value: { departments: {}, rules: {}, ecologicalZonings: {} }
}
export const referentialSlice = createSlice({
	name: "referential",
	initialState,
	extraReducers: (builder) => {
		builder.addCase(getReferentialThunk.fulfilled, (state, { payload }) => {
			state.status = "success"
			state.value = {
				departments: payload.departments ?? {},
				rules: payload.rules ?? {},
				ecologicalZonings: payload.ecologicalZonings ?? {}
			}
		})
		builder.addCase(getReferentialThunk.rejected, (state) => {
			state.status = "error"
		})
		builder.addCase(getReferentialThunk.pending, (state) => {
			state.status = "loading"
		})
	},
	reducers: {}
})

const selectState = (state: RootState) => state.referential
export const selectReferentialStatus = createTypedDraftSafeSelector(
	selectState,
	(referential) => referential.status
)
function selectByIds<
	T extends keyof State["value"],
	K extends keyof State["value"][T]
>(property: T) {
	return createTypedDraftSafeSelector(
		[selectState, (_s: RootState, ids: K[] = []) => ids],
		(referential: State, ids: K[] = []) =>
			ids
				.map((id) => {
					const item = referential.value[property][id]
					return item === undefined
						? undefined
						: ({ id, ...item } as ItemFromRecord<
								Record<string, State["value"][T][K]>
							>)
				})
				.filter((d) => d !== undefined)
	)
}

function selectByIdsDifferent<
	T extends keyof State["value"],
	K extends keyof State["value"][T]
>(property: T) {
	return createTypedDraftSafeSelector(
		[selectState, (_s: RootState, ids: K[] = []) => ids],
		(referential: State, ids: K[] = []) =>
			Object.entries(referential.value[property])
				.filter(([id]) => !ids.includes(id as K))
				.map(
					([id, value]) =>
						({ id, ...value }) as State["value"][T][K] & { id: K }
				)
	)
}

const selectSelectableItemsNamedId = createTypedDraftSafeSelector(
	[selectState, (_s, property) => property],
	<K extends "departments">(s: State, property: K) => {
		return Object.entries(s.value[property]).map(
			([k, v]) =>
				({
					isSelected: false,
					item: { id: k, name: v.name }
				}) satisfies SelectableItem<NamedId>
		)
	}
)
export const useSelectSelectableDepartments = () =>
	useAppSelector((s) => selectSelectableItemsNamedId(s, "departments"))

export const selectDepartmentsByIds = selectByIds("departments")
export const selectRulesByIds = selectByIds("rules")
export const selectEcologicalZoningByIds = selectByIds("ecologicalZonings")

export const selectDepartmentsByIdsDifferent =
	selectByIdsDifferent("departments")
export const selectRulesByIdsDifferent = selectByIdsDifferent("rules")
export const selectEcologicalZoningByIdsDifferent =
	selectByIdsDifferent("ecologicalZonings")
