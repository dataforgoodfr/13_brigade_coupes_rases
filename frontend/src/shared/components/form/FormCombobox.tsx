import type { ReactNode } from "react";
import type {
	ControllerRenderProps,
	FieldPathValue,
	FieldValues,
	Path,
} from "react-hook-form";
import {
	FormFieldLayout,
	type FormFieldLayoutProps,
} from "@/shared/components/form/FormFieldLayout";
import { Combobox } from "@/shared/components/select/Combobox";
import type { ComboboxFilterProps } from "@/shared/components/select/ComboboxFilter";
import { type UseEnhancedItemsOptions, useEnhancedItems } from "@/shared/items";
import { FormField, type FormProps } from "./Form";

type Props<
	T extends FieldValues,
	Name extends Path<T>,
	TLabel extends ReactNode,
	TValue extends string,
> = FormProps<T, Name> &
	Omit<
		UseEnhancedItemsOptions<
			FieldPathValue<T, Name>[number]["item"],
			TLabel,
			TValue
		>,
		"items"
	> &
	FormFieldLayoutProps &
	Omit<ComboboxFilterProps<unknown>, "items" | "onChanged">;
export function FormCombobox<
	T extends FieldValues,
	Name extends Path<T>,
	TLabel extends ReactNode,
	TValue extends string,
>({
	control,
	name,
	disabled = false,
	...props
}: Props<T, Name, TLabel, TValue>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => <Renderer {...props} field={field} />}
		/>
	);
}

function Renderer<
	T extends FieldValues,
	Name extends Path<T>,
	TLabel extends ReactNode,
	TValue extends string,
>({
	field,
	...props
}: Omit<
	UseEnhancedItemsOptions<
		FieldPathValue<T, Name>[number]["item"],
		TLabel,
		TValue
	>,
	"items"
> &
	FormFieldLayoutProps &
	Omit<ComboboxFilterProps<unknown>, "items" | "onChanged"> & {
		field: ControllerRenderProps<T, Name>;
	}) {
	const items = useEnhancedItems({ items: field.value, ...props });
	return (
		<FormFieldLayout {...props}>
			<Combobox {...props} onChanged={field.onChange} items={items} />
		</FormFieldLayout>
	);
}
