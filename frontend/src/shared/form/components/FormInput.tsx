import type { HTMLInputTypeAttribute } from "react"
import type { FieldValues } from "react-hook-form"

import { Input } from "@/components/ui/input"
import {
	FormFieldLayout,
	type FormFieldLayoutProps
} from "@/shared/form/components/FormFieldLayout"

import type { FormProps } from "../types"

export function FormInput<Form extends FieldValues = FieldValues>({
	form,
	name,
	type,
	field,
	...props
}: FormProps<Form> & {
	type: HTMLInputTypeAttribute
} & FormFieldLayoutProps<Form>) {
	return (
		<FormFieldLayout {...props} name={name}>
			<Input type={type} {...field} {...props} />
		</FormFieldLayout>
	)
}
