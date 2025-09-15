import type { ReactNode } from "react";
import type {
	ControllerRenderProps,
	FieldPathValue,
	FieldValues,
	Path,
} from "react-hook-form";
import { Combobox } from "@/shared/components/select/Combobox";
import type { ComboboxFilterProps } from "@/shared/components/select/ComboboxFilter";
import {
	FormFieldLayout,
	type FormFieldLayoutProps,
} from "@/shared/form/FormFieldLayout";
import { type UseEnhancedItemsOptions, useEnhancedItems } from "@/shared/items";
import { FormField } from "./Form";
import type { FormProps } from "./types";

type Props<
	Form extends FieldValues,
	Name extends Path<Form>,
	TLabel extends ReactNode,
	TValue extends string,
> = FormProps<Form, Name> &
	Omit<
		UseEnhancedItemsOptions<
			FieldPathValue<Form, Name>[number]["item"],
			TLabel,
			TValue
		>,
		"items"
	> &
	FormFieldLayoutProps<Form> &
	Omit<ComboboxFilterProps<unknown>, "items" | "onChanged">;
export function FormCombobox<
	Form extends FieldValues,
	Name extends Path<Form>,
	TLabel extends ReactNode,
	TValue extends string,
>({ form, name, ...props }: Props<Form, Name, TLabel, TValue>) {
	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<Renderer {...props} form={form} name={name} field={field} />
			)}
		/>
	);
}

function Renderer<
	Form extends FieldValues,
	Name extends Path<Form>,
	TLabel extends ReactNode,
	TValue extends string,
>({
	field,
	...props
}: Omit<
	UseEnhancedItemsOptions<
		FieldPathValue<Form, Name>[number]["item"],
		TLabel,
		TValue
	>,
	"items"
> &
	FormFieldLayoutProps<Form> &
	Omit<ComboboxFilterProps<unknown>, "items" | "onChanged"> & {
		field: ControllerRenderProps<Form, Name>;
	}) {
	const items = useEnhancedItems({ items: field.value, ...props });
	return (
		<FormFieldLayout {...props}>
			<Combobox {...props} onChanged={field.onChange} items={items} />
		</FormFieldLayout>
	);
}
