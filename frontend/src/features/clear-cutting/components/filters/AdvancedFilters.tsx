import {
	filtersSlice,
	getFiltersThunk,
	selectCutYears,
	selectDepartments,
} from "@/features/clear-cutting/store/filters.slice";
import { DropdownFilter } from "@/shared/components/dropdown/DropdownFilter";
import { Input } from "@/shared/components/input/Input";
import { ComboboxFilter } from "@/shared/components/select/ComboboxFilter";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import {
	type NamedId,
	type SelectableItem,
	selectableItemToString,
	useEnhancedItems,
} from "@/shared/items";
import clsx from "clsx";

import { useEffect } from "react";

const namedIdTranslator = ({ item }: SelectableItem<NamedId>) =>
	item.name.toString();

interface Props {
	className?: string;
}

export function AdvancedFilters({ className }: Props) {
	const dispatch = useAppDispatch();
	const cutYears = useEnhancedItems(
		useAppSelector(selectCutYears),
		selectableItemToString,
		selectableItemToString,
	);
	const departments = useEnhancedItems(
		useAppSelector(selectDepartments),
		namedIdTranslator,
		namedIdTranslator,
	);

	useEffect(() => {
		dispatch(getFiltersThunk());
	}, [dispatch]);
	return (
		<div className={clsx("flex flex-wrap gap-1", className)}>
			<ComboboxFilter
				type="multiple"
				countPreview
				hasInput
				hasReset
				label="Années de coupe"
				items={cutYears}
				changeOnClose={(cutYears) =>
					dispatch(filtersSlice.actions.setCutYears(cutYears))
				}
			/>
			<ComboboxFilter
				type="multiple"
				countPreview
				hasInput
				hasReset
				label="Départements"
				items={departments}
				changeOnClose={(departments) =>
					dispatch(filtersSlice.actions.setDepartments(departments))
				}
			/>
			<DropdownFilter filter="Superficie">
				<div className="flex flex-col w-45">
					<div className="flex">
						<Input
							id="minArea"
							type="number"
							placeholder="Min"
							suffix={"Hectares"}
						/>
						<Input
							id="maxArea"
							type="number"
							placeholder="Max"
							suffix={"Hectares"}
						/>
					</div>
				</div>
			</DropdownFilter>
		</div>
	);
}
