import type { FieldValues } from "react-hook-form"

import { Textarea } from "@/components/ui/text-area"
import {
	FormFieldLayout,
	type FormFieldLayoutProps
} from "@/shared/form/components/FormFieldLayout"

import type { FormProps } from "../types"

export function FormTextArea<Form extends FieldValues = FieldValues>({
	form,
	name,
	placeholder,
	field,
	...props
}: FormProps<Form> & FormFieldLayoutProps<Form>) {
	return (
		<FormFieldLayout {...props} name={name}>
			<Textarea
				{...field}
				className="mt-2 max-w-[98%] mx-auto"
				placeholder={placeholder}
			/>
		</FormFieldLayout>
	)
}
