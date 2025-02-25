import {
	MultiSelectCombobox,
	type MultiSelectComboboxProps,
} from "@/shared/components/select/MultiSelectCombobox";

interface MultiSelectComboboxFilterProps<TItem>
	extends MultiSelectComboboxProps<TItem> {
	label: string;
}

export function MultiSelectComboboxFilter<TItem>({
	...props
}: MultiSelectComboboxFilterProps<TItem>) {
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
			}}
		/>
	);
}
