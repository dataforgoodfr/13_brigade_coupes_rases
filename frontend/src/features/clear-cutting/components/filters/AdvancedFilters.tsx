import {
	filtersSlice,
	getFiltersThunk,
	selectCutYears,
	selectDepartments,
} from "@/features/clear-cutting/store/filters.slice";
import { Slider } from "@/shared/components/Slider";
import { DropdownFilter } from "@/shared/components/dropdown/DropdownFilter";
import { MultiSelectComboboxFilter } from "@/shared/components/select/MultiSelectComboboxFilter";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import type { NamedId, SelectableItem } from "@/shared/items";
import clsx from "clsx";

import { useEffect } from "react";
const numberTranslator = ({ item }: SelectableItem<number>) => item.toString();
const namedIdTranslator = ({ item }: SelectableItem<NamedId>) =>
	item.name.toString();

interface Props {
	className?: string;
}
export function AdvancedFilters({ className }: Props) {
	const dispatch = useAppDispatch();
	const cutYears = useAppSelector(selectCutYears);
	const departments = useAppSelector(selectDepartments);

	useEffect(() => {
		dispatch(getFiltersThunk());
	}, [dispatch]);
	return (
		<div className={clsx("flex flex-wrap gap-1", className)}>
			<MultiSelectComboboxFilter
				label="Années de coupe"
				getItemLabel={numberTranslator}
				getItemValue={numberTranslator}
				items={cutYears}
				onItemToggled={(cutYear) =>
					dispatch(filtersSlice.actions.toggleCutYear(cutYear))
				}
			/>
			<MultiSelectComboboxFilter
				label="Départements"
				getItemLabel={namedIdTranslator}
				getItemValue={namedIdTranslator}
				items={departments}
				onItemToggled={(department) =>
					dispatch(filtersSlice.actions.toggleDepartment(department))
				}
			/>
			<DropdownFilter filter="Superficie">
				<Slider />
			</DropdownFilter>
		</div>
	);
}
