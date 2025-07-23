import { RuleLayout } from "@/features/admin/components/rules/RuleLayout";
import type { EcologicalZoningRule } from "@/features/admin/store/rules.slice";
import { Badge } from "@/shared/components/Badge";
import { ComboboxFilter } from "@/shared/components/select/ComboboxFilter";
import { type SelectableItem, useEnhancedItems } from "@/shared/items";
import type { EcologicalZoning } from "@/shared/store/referential/referential";

type Props = {
	className?: string;
	updateEcologicalZonings: (
		ecologicalZonings: SelectableItem<EcologicalZoning>[],
	) => void;
} & EcologicalZoningRule;
export function EcologicalZoningRuleComponent({
	ecological_zonings,
	className,
	updateEcologicalZonings,
}: Props) {
	const items = useEnhancedItems(
		ecological_zonings,
		(item) => item.item.name,
		(item) => item.item.name,
	);
	return (
		<RuleLayout
			className={className}
			inputId="ecological_zoning"
			label="Classification zones protégées Natura 2000"
			hint="Déclenche une alerte si une coupe ≥ 0,5 ha se trouve dans l’une des zones protégées sélectionnées."
		>
			<ComboboxFilter
				type="multiple"
				countPreview
				hasInput
				hasReset
				id="ecological_zoning"
				label="Zones"
				items={items}
				changeOnClose={updateEcologicalZonings}
			/>
			<div className="flex flex-wrap gap-2">
				{items
					.filter((i) => i.isSelected)
					.map((item) => (
						<Badge
							variant="outline"
							key={item.value}
							className="mt-2 text-zinc-500"
							onDismiss={() =>
								updateEcologicalZonings(
									items.filter((i) => i.value !== item.value),
								)
							}
						>
							{item.item.name}
						</Badge>
					))}
			</div>
		</RuleLayout>
	);
}
