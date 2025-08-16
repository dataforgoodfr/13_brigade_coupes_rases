import { Button } from "@/components/ui/button";
import { EcologicalZoningRuleComponent } from "@/features/admin/components/rules/EcologicalZoningRule";
import { VariableRule } from "@/features/admin/components/rules/VariableRule";
import {
	getRulesThunk,
	rulesSlice,
	updateRulesThunk,
	useGetRules,
} from "@/features/admin/store/rules.slice";
import { useAppDispatch } from "@/shared/hooks/store";

const RULES_PROPS = {
	slope: {
		label: "Seuil d’alerte de la pente (%)",
		hint: "Déclenche une alerte si une zone de coupe de 2 ha ou plus est située sur une pente supérieure ou égale à ce pourcentage.",
	},
	area: {
		label: "Seuil d’alerte superficie du terrain (ha)",
		hint: "Déclenche une alerte si la surface totale de la coupe dépasse ce seuil.",
	},
};

export function RulesTab() {
	const rules = useGetRules(["slope", "area", "ecological_zoning"]);

	const dispatch = useAppDispatch();
	return (
		<>
			{rules?.map((rule) =>
				rule.type === "ecological_zoning" ? (
					<EcologicalZoningRuleComponent
						className="w-full"
						key={rule.type}
						updateEcologicalZonings={(ecologicalZonings) =>
							dispatch(
								rulesSlice.actions.updateEcologicalZoningRule(
									ecologicalZonings,
								),
							)
						}
						{...rule}
					/>
				) : (
					<VariableRule
						label={RULES_PROPS[rule.type].label}
						hint={RULES_PROPS[rule.type].hint}
						inputId={rule.type}
						key={rule.type}
						value={rule.threshold}
						onThresholdUpdated={(value) =>
							dispatch(
								rulesSlice.actions.updateVariableRule({
									type: rule.type,
									value,
								}),
							)
						}
						{...rule}
					/>
				),
			)}
			<div className="flex gap-2 mt-4">
				<Button variant="zinc" onClick={() => dispatch(getRulesThunk())}>
					Annuler
				</Button>
				<Button variant="default" onClick={() => dispatch(updateRulesThunk())}>
					Enregistrer
				</Button>
			</div>
		</>
	);
}
