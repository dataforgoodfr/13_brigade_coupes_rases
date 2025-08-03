import {
	type RulesResponse,
	type UpdateRulesRequest,
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
	selectEcologicalZoningByIds,
	selectEcologicalZoningByIdsDifferent,
} from "@/shared/store/referential/referential.slice";
import { createTypedDraftSafeSelector } from "@/shared/store/selector";
import type { RootState } from "@/shared/store/store";
import { createAppAsyncThunk } from "@/shared/store/thunk";
import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import { useEffect } from "react";
export type EcologicalZoningRule = {
	type: EcologicalZoningType;
	ecologicalZonings: SelectableItem<EcologicalZoning>[];
};
type Rule =
	| VariableRuleResponse
	| {
			id: string;
			type: EcologicalZoningType;
			ecologicalZonings: SelectableItem<EcologicalZoning>[];
	  };
type State = {
	rules: RequestedContent<Rule[]>;
};

export const updateRulesThunk = createAppAsyncThunk<void, void>(
	"rules/updateRules",
	async (_, { getState, extra: { api }, dispatch }) => {
		const state = getState();
		const rules = selectRules(state);
		if (rules === undefined) {
			throw new Error("Rules are not loaded");
		}
		await api().put("api/v1/rules", {
			json: {
				rules: rules?.map((r) => ({
					id: r.id,
					threshold: r.type !== "ecological_zoning" ? r.threshold : undefined,
					ecologicalZoningsIds:
						r.type === "ecological_zoning"
							? r.ecologicalZonings
									.filter((item) => item.isSelected)
									.map((item) => item.item.id)
							: [],
				})),
			} satisfies UpdateRulesRequest,
		});
		dispatch(getRulesThunk());
	},
);
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
						ecologicalZoningsIds: undefined,
						ecologicalZonings: [
							...listToSelectableItems(
								selectEcologicalZoningByIds(state, rule.ecologicalZoningsIds),
								true,
							),
							...listToSelectableItems(
								selectEcologicalZoningByIdsDifferent(
									state,
									rule.ecologicalZoningsIds,
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
							ecologicalZonings: payload,
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
						return { ...rule, threshold: payload.value };
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

export const useGetRules = (order: RuleType[]) => {
	const dispatch = useAppDispatch();
	const rules = useAppSelector(selectRules);
	useEffect(() => {
		dispatch(getRulesThunk());
	}, [dispatch]);
	const findByType = (type: RuleType) => rules?.find((r) => r.type === type);
	return order.map(findByType).filter((r) => r !== undefined);
};
