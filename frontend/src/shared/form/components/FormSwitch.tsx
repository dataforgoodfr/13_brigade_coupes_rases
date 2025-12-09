import type { FieldValues } from "react-hook-form"

import { Switch } from "@/components/ui/switch"
import {
	FormFieldLayout,
	type FormFieldLayoutProps
} from "@/shared/form/components/FormFieldLayout"

import type { FormProps } from "../types"

export function FormSwitch<T extends FieldValues = FieldValues>({
	form,
	name,
	field,
	...props
}: FormProps<T> & FormFieldLayoutProps<T>) {
	return (
		<FormFieldLayout {...props} name={name}>
			<Switch
				disabled={field.disabled}
				checked={field.value}
				onCheckedChange={field.onChange}
			/>
		</FormFieldLayout>
	)
}
