import { isEqual, isUndefined } from "es-toolkit"
import { useMemo } from "react"
import { type FieldValues, get, type Path } from "react-hook-form"

import type { FormType } from "@/shared/form/types"

type UseHasChangedOptions<Form extends FieldValues, Name extends Path<Form>> = {
	original?: Form
	name: Name
	form: FormType<Form>
}
export function useHasChanged<
	Form extends FieldValues,
	Name extends Path<Form>
>({ original, name, form }: UseHasChangedOptions<Form, Name>) {
	const currentValue = form.getValues(name)
	return useMemo(() => {
		if (isUndefined(original)) {
			return
		}
		const originalValue = get(original, name)
		return {
			hasChanged: !isEqual(currentValue, originalValue),
			originalValue,
			currentValue
		}
	}, [currentValue, name, original])
}
