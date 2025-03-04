import { api } from "@/shared/api/api";
import type { RequiredRequestedContent } from "@/shared/api/types";
import type { ItemFromRecord } from "@/shared/array";
import {
	type ReferentialResponse,
	referentialSchemaResponse,
} from "@/shared/store/referential/referential";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import {
	createAsyncThunk,
	createSelector,
	createSlice,
} from "@reduxjs/toolkit";

export const getReferentialThunk = createAsyncThunk(
	"referential/get",
	async () => {
		const result = await api.get<ReferentialResponse>("referential").json();
		return referentialSchemaResponse.parse(result);
	},
);
type State = RequiredRequestedContent<Required<ReferentialResponse>>;
const initialState: State = {
	status: "idle",
	value: { departments: {}, tags: {}, ecologicalZoning: {} },
};
export const referentialSlice = createSlice({
	name: "referential",
	initialState,
	extraReducers: (builder) => {
		builder.addCase(getReferentialThunk.fulfilled, (state, { payload }) => {
			state.status = "success";
			state.value = {
				departments: payload.departments ?? {},
				tags: payload.tags ?? {},
				ecologicalZoning: payload.ecologicalZoning ?? {},
			};
		});
		builder.addCase(getReferentialThunk.rejected, (state, error) => {
			state.status = "error";
			console.error(error);
		});
		builder.addCase(getReferentialThunk.pending, (state) => {
			state.status = "loading";
		});
	},
	reducers: {},
});

const selectState = (state: RootState) => state.referential;
export const selectReferentialStatus = createTypedDraftSafeSelector(
	selectState,
	(referential) => referential.status,
);
function selectByIds<
	T extends keyof State["value"],
	K extends keyof State["value"][T],
>(property: T) {
	return createSelector(
		[selectState, (_s: RootState, ids: K[] = []) => ids],
		(referential: State, ids: K[] = []) =>
			ids
				.map((id) => {
					const item = referential.value[property][id];
					return item === undefined
						? undefined
						: ({ id, ...item } as ItemFromRecord<
								Record<string, State["value"][T][K]>
							>);
				})
				.filter((d) => d !== undefined),
	);
}

export const selectDepartmentsByIds = selectByIds("departments");
export const selectTagsByIds = selectByIds("tags");
export const selectEcologicalZoningByIds = selectByIds("ecologicalZoning");
