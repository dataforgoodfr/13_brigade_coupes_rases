import type { EcologicalZoningRule } from "@/features/admin/store/rules.slice";
import { ComboboxFilter } from "@/shared/components/select/ComboboxFilter";
import { type SelectableItem, useEnhancedItems } from "@/shared/items";
import type { EcologicalZoning } from "@/shared/store/referential/referential";

type Props = {
	updateEcologicalZonings: (
		ecologicalZonings: SelectableItem<EcologicalZoning>[],
	) => void;
} & EcologicalZoningRule;
export function EcologicalZoningRuleComponent({
	ecological_zonings,
	updateEcologicalZonings,
}: Props) {
	const items = useEnhancedItems(
		ecological_zonings,
		(item) => item.item.name,
		(item) => item.item.name,
	);
	return (
		<div className="flex w-1/2 flex-col gap-1">
			<label htmlFor="ecological_zoning">Zones écologiques</label>
			<ComboboxFilter
				type="multiple"
				countPreview
				hasInput
				hasReset
				id="ecological_zoning"
				label="Zones écologiques"
				items={items}
				changeOnClose={updateEcologicalZonings}
			/>
		</div>
	);
}
