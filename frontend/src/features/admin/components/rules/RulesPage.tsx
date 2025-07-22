import { EcologicalZoningRuleComponent } from "@/features/admin/components/rules/EcologicalZoningRule";
import { VariableRule } from "@/features/admin/components/rules/VariableRule";
import {
	rulesSlice,
	selectRuleByTypes,
	useGetRules,
} from "@/features/admin/store/rules.slice";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";

export function RulesPage() {
	const rules = useGetRules();
	const dispatch = useAppDispatch();
	const ecologicalZoningRule = useAppSelector(
		selectRuleByTypes(["ecological_zoning"]),
	).at(0);
	const variableRules = useAppSelector(selectRuleByTypes(["area", "slope"]));
	return rules ? (
		rules.map((rule) => {
			rule.type === "ecological_zoning" ? (
				<EcologicalZoningRuleComponent
					updateEcologicalZonings={(ecologicalZonings) =>
						dispatch(
							rulesSlice.actions.updateEcologicalZoningRule(ecologicalZonings),
						)
					}
					{...rule}
				/>
			) : (
				<VariableRule {...rule} />
			);
		})
	) : (
		<></>
	);
}
