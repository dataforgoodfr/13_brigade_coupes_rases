import {
	filtersSlice,
	getFiltersThunk,
	selectCutYears,
	selectDepartments,
} from "@/features/clear-cutting/store/filters.slice";
import {
	MultiSelectCombobox,
	type MultiSelectComboboxProps,
} from "@/shared/components/select/MultiSelectCombobox";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import type { NamedId, SelectableItem } from "@/shared/items";
import clsx from "clsx";

import { useEffect } from "react";
const numberTranslator = ({ item }: SelectableItem<number>) => item.toString();
const namedIdTranslator = ({ item }: SelectableItem<NamedId>) =>
	item.name.toString();

interface FiltersMultiSelectComboboxProps<TItem>
	extends MultiSelectComboboxProps<TItem> {
	label: string;
}
function FiltersMultiSelectCombobox<TItem>({
	...props
}: FiltersMultiSelectComboboxProps<TItem>) {
	return (
		<MultiSelectCombobox
			{...props}
			commandInputProps={{
				...props.commandInputProps,
				placeholder: props.label,
			}}
			buttonProps={{
				...props.buttonProps,
				children: props.label,
				variant: "outline",
				className: "rounded-full text-secondary border-secondary",
			}}
		/>
	);
}
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
			<FiltersMultiSelectCombobox
				label="Années de coupe"
				getItemLabel={numberTranslator}
				getItemValue={numberTranslator}
				items={cutYears}
				onItemToggled={(cutYear) =>
					dispatch(filtersSlice.actions.toggleCutYear(cutYear))
				}
			/>
			<FiltersMultiSelectCombobox
				label="Départements"
				getItemLabel={namedIdTranslator}
				getItemValue={namedIdTranslator}
				items={departments}
				onItemToggled={(department) =>
					dispatch(filtersSlice.actions.toggleDepartment(department))
				}
			/>
		</div>
	);
}
