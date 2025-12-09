import type { FieldValues } from "react-hook-form"

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/shared/components/Select"
import { FormFieldLayout } from "@/shared/form/components/FormFieldLayout"
import type { LabelledValue } from "@/shared/items"

import type { FormProps } from "../types"

export function FormSelect<T extends FieldValues = FieldValues>({
	form,
	name,
	placeholder,
	availableValues,
	field,
	...props
}: FormProps<T> & {
	availableValues: LabelledValue[]
}) {
	return (
		<FormFieldLayout {...props} name={name}>
			<Select value={field.value} onValueChange={field.onChange}>
				<SelectTrigger>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{availableValues.map(({ label, value }) => (
						<SelectItem value={value} key={value}>
							{label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</FormFieldLayout>
	)
}
