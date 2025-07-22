import {
	type RulesResponse,
	type VariableRuleResponse,
	rulesResponseSchema,
} from "@/features/admin/store/rules";
import type { RequestedContent } from "@/shared/api/types";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { type SelectableItem, listToSelectableItems } from "@/shared/items";
import type {
	EcologicalZoning,
	EcologicalZoningType,
	RuleType,
	VariableRulesType as VariableRuleType,
} from "@/shared/store/referential/referential";
import {
	selectDepartmentsByIdsDifferent,
	selectEcologicalZoningByIds,
} from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { createAppAsyncThunk } from "@/shared/store/thunk";
import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import { useEffect } from "react";
export type EcologicalZoningRule = {
	type: EcologicalZoningType;
	ecological_zonings: SelectableItem<EcologicalZoning>[];
};
type Rule =
	| VariableRuleResponse
	| {
			type: EcologicalZoningType;
			ecological_zonings: SelectableItem<EcologicalZoning>[];
	  };
type State = {
	rules: RequestedContent<Rule[]>;
};

export const getRulesThunk = createAppAsyncThunk<Rule[], void>(
	"rules/getRules",
	async (_, { getState, extra: { api } }) => {
		const result = await api().get<RulesResponse>("api/v1/rules").json();
		const response = rulesResponseSchema.parse(result);
		const state = getState();
		return response.map((rule) =>
			rule.type === "ecological_zoning"
				? {
						...rule,
						ecological_zonings_ids: undefined,
						ecological_zonings: [
							...listToSelectableItems(
								selectEcologicalZoningByIds(state, rule.ecological_zonings_ids),
								true,
							),
							...listToSelectableItems(
								selectDepartmentsByIdsDifferent(
									state,
									rule.ecological_zonings_ids,
								),
							),
						],
					}
				: rule,
		);
	},
);

export const rulesSlice = createSlice({
	initialState: { rules: { status: "idle" } } as State,
	name: "rules",
	reducers: {
		updateEcologicalZoningRule: (
			state,
			{ payload }: PayloadAction<SelectableItem<EcologicalZoning>[]>,
		) => {
			if (state.rules.value) {
				state.rules.value = state.rules.value.map((rule) => {
					if (rule.type === "ecological_zoning") {
						return {
							...rule,
							ecological_zonings: payload,
						} satisfies EcologicalZoningRule;
					}
					return rule;
				});
			}
		},
		updateVariableRule: (
			state,
			{ payload }: PayloadAction<{ type: VariableRuleType; value: number }>,
		) => {
			if (state.rules.value) {
				state.rules.value = state.rules.value.map((rule) => {
					if (rule.type === payload.type) {
						return { ...rule, value: payload.value };
					}
					return rule;
				});
			}
		},
	},
	extraReducers: (builder) => {
		builder.addCase(getRulesThunk.fulfilled, (state, { payload }) => {
			state.rules.value = payload;
			state.rules.status = "success";
		});
		builder.addCase(getRulesThunk.rejected, (state, _error) => {
			state.rules.status = "error";
		});
		builder.addCase(getRulesThunk.pending, (state) => {
			state.rules.status = "loading";
		});
	},
});

const selectState = (state: RootState) => state.rules;
const selectRules = createTypedDraftSafeSelector(
	selectState,
	(state) => state.rules.value,
);
export const selectRuleByTypes = (types: RuleType[]) =>
	createTypedDraftSafeSelector(
		(state: RootState) => selectRules(state),
		(rules) => {
			return rules?.filter((r) => types.includes(r.type)) ?? [];
		},
	);
export const useGetRules = () => {
	const dispatch = useAppDispatch();
	const rules = useAppSelector(selectRules);
	useEffect(() => {
		dispatch(getRulesThunk());
	}, [dispatch]);
	return rules;
};
