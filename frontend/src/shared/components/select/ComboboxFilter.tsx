import {
	Combobox,
	type ComboboxProps,
	type MultiSelectComboboxProps,
	type SingleSelectComboboxProps,
} from "@/shared/components/select/Combobox";

type ComboboxFilterWithoutInputProps<TItem> = Omit<
	ComboboxProps<TItem>,
	"commandInputProps"
> & {
	hasInput: false;
};

type ComboboxFilterWithInputProps<TItem> = ComboboxProps<TItem> & {
	hasInput: true;
};
export type ComboboxFilterProps<TItem> = { label?: string } & (
	| ComboboxFilterWithoutInputProps<TItem>
	| ComboboxFilterWithInputProps<TItem>
) &
	(SingleSelectComboboxProps<TItem> | MultiSelectComboboxProps<TItem>);
export function ComboboxFilter<TItem>({
	...props
}: ComboboxFilterProps<TItem>) {
	return (
		<Combobox
			{...props}
			commandInputProps={
				props.hasInput === true
					? {
							...props.commandInputProps,
							placeholder: props.label,
						}
					: undefined
			}
			buttonProps={{
				...props.buttonProps,
				children: props.label,
			}}
		/>
	);
}
