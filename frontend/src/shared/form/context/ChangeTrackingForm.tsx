import { isEqual, isUndefined } from "es-toolkit"
import { createContext, type ReactNode, useContext, useMemo } from "react"
import { type FieldValues, get, type Path } from "react-hook-form"

import type { FormType } from "@/shared/form/types"

type ChangeTracking<
	Form extends FieldValues = FieldValues,
	Name extends Path<Form> = Path<Form>,
	Others extends Record<string, Form | undefined> = Record<
		string,
		Form | undefined
	>,
	OtherKey extends keyof Others & string = keyof Others & string
> = Record<Name, ChangeTrackingEntries<Form, Name, Others, OtherKey>>

type ChangeTrackingEntries<
	Form extends FieldValues = FieldValues,
	Name extends Path<Form> = Path<Form>,
	Others extends Record<string, Form | undefined> = Record<
		string,
		Form | undefined
	>,
	OtherKey extends keyof Others & string = keyof Others & string
> = Record<OtherKey, ChangeTrackingEntry<Form, Name>>

type ChangeTrackingEntry<
	Form extends FieldValues = FieldValues,
	Name extends Path<Form> = Path<Form>
> = {
	hasChanged: boolean
	otherValue: Form[Name]
	currentValue: Form[Name]
}
type ChangeTrackingFormContextType<
	Form extends FieldValues = FieldValues,
	Name extends Path<Form> = Path<Form>,
	Others extends Record<string, Form | undefined> = Record<
		string,
		Form | undefined
	>,
	OtherKey extends keyof Others & string = keyof Others & string
> = {
	others: Others
	form: FormType<Form>
	changedFields: Partial<Record<OtherKey, number>>
	trackedFields?: Name[]
	resetTrackedFieldsFromOther: (otherKey: OtherKey) => void
	resetTrackedFieldFromOther: (field: Name, otherKey: OtherKey) => void
	hasChanged: (
		field: Name,
		other: OtherKey
	) => ChangeTracking<Form, Name, Others, OtherKey>[Name][OtherKey] | undefined
}

const ChangeTrackingFormContext = createContext<ChangeTrackingFormContextType>(
	undefined as unknown as ChangeTrackingFormContextType
)
type ContextReturn<
	Form extends FieldValues = FieldValues,
	Name extends Path<Form> = Path<Form>,
	Others extends Record<string, Form | undefined> = Record<
		string,
		Form | undefined
	>,
	OtherKey extends keyof Others & string = keyof Others & string
> = ReturnType<
	typeof createContext<
		ChangeTrackingFormContextType<Form, Name, Others, OtherKey>
	>
>

type Props<
	Form extends FieldValues = FieldValues,
	Name extends Path<Form> = Path<Form>,
	Others extends Record<string, Form | undefined> = Record<
		string,
		Form | undefined
	>,
	OtherKey extends keyof Others & string = keyof Others & string
> = Pick<
	ChangeTrackingFormContextType<Form, Name, Others, OtherKey>,
	"others" | "form" | "trackedFields"
> & {
	children: ReactNode
}

export function ChangeTrackingProvider<
	Form extends FieldValues,
	Name extends Path<Form>,
	Others extends Record<string, Form | undefined> = Record<
		string,
		Form | undefined
	>,
	OtherKey extends keyof Others & string = keyof Others & string
>({
	others,
	form,
	trackedFields = [],
	children
}: Props<Form, Name, Others, OtherKey>) {
	const otherKeys = Object.keys(others).filter(
		(k) => !isUndefined(others[k])
	) as OtherKey[]
	const changeTrackingFields = useMemo(() => {
		return Object.fromEntries(
			trackedFields.map((field) => {
				const currentValue = form.getValues(field)
				const t = [
					field as Name,
					Object.fromEntries(
						otherKeys.map((other) => {
							const otherValue = get(others[other], field)
							return [
								other as OtherKey,
								{
									otherValue: otherValue as Form[Name],
									currentValue,
									hasChanged: !isEqual(otherValue, currentValue)
								} as ChangeTrackingEntries<Form, Name, Others, OtherKey>
							] as const
						})
					)
				] as const
				return t
			})
		) as ChangeTracking<Form, Name, Others, OtherKey>
	}, [trackedFields, others, form, otherKeys])
	const changedFields = useMemo(() => {
		return Object.entries(changeTrackingFields).reduce(
			(acc, [_, changes]) => {
				Object.entries(
					changes as ChangeTrackingEntries<Form, Name, Others, OtherKey>
				).forEach(([otherKey, change]) => {
					if ((change as ChangeTrackingEntry<Form, Name>).hasChanged) {
						acc[otherKey as OtherKey] = (acc[otherKey as OtherKey] || 0) + 1
					}
				})
				return acc
			},
			{} as Partial<Record<OtherKey, number>>
		)
	}, [changeTrackingFields])
	const FormContext = ChangeTrackingFormContext as unknown as ContextReturn<
		Form,
		Name,
		Others,
		OtherKey
	>

	const hasChanged = (field: Name, otherKey: OtherKey) => {
		return changeTrackingFields[field]?.[otherKey]
	}
	const resetTrackedFieldsFromOther = (otherKey: OtherKey) => {
		trackedFields.forEach((field) => {
			const other = others[otherKey]
			if (!isUndefined(other)) {
				form.resetField(field, {
					defaultValue: get(other, field)
				})
			}
		})
	}
	const resetTrackedFieldFromOther = (field: Name, otherKey: OtherKey) => {
		form.resetField(field, {
			defaultValue: get(others[otherKey], field)
		})
	}
	return (
		<FormContext.Provider
			value={{
				others: others,
				form: form,
				hasChanged,
				changedFields,
				resetTrackedFieldFromOther,
				resetTrackedFieldsFromOther,
				trackedFields
			}}
		>
			{children}
		</FormContext.Provider>
	)
}

export function useChangeTrackingFormContext<
	Form extends FieldValues,
	Name extends Path<Form>,
	Others extends Record<string, Form | undefined> = Record<
		string,
		Form | undefined
	>,
	OtherKey extends keyof Others & string = keyof Others & string
>() {
	return useContext(
		ChangeTrackingFormContext as unknown as ContextReturn<
			Form,
			Name,
			Others,
			OtherKey
		>
	)
}
