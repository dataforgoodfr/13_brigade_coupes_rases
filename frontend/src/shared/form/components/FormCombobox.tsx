import type { ReactNode } from "react"
import type { FieldPathValue, FieldValues, Path } from "react-hook-form"

import { Combobox } from "@/shared/components/select/Combobox"
import type { ComboboxFilterProps } from "@/shared/components/select/ComboboxFilter"
import {
	FormFieldLayout,
	type FormFieldLayoutProps
} from "@/shared/form/components/FormFieldLayout"
import type { FormProps } from "@/shared/form/types"
import { type UseEnhancedItemsOptions, useEnhancedItems } from "@/shared/items"

type Props<
	Form extends FieldValues,
	Name extends Path<Form>,
	TLabel extends ReactNode,
	TValue extends string
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
	Omit<ComboboxFilterProps<unknown>, "items" | "onChanged">
export function FormCombobox<
	Form extends FieldValues,
	Name extends Path<Form>,
	TLabel extends ReactNode = ReactNode,
	TValue extends string = string
>({ form, name, field, ...props }: Props<Form, Name, TLabel, TValue>) {
	const items = useEnhancedItems({ items: field.value, ...props })
	return (
		<FormFieldLayout name={name} {...props}>
			<Combobox {...props} onChanged={field.onChange} items={items} />
		</FormFieldLayout>
	)
}
