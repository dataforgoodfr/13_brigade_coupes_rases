import type { ReactNode } from "react"
import type { FieldValues, Path, PathValue } from "react-hook-form"

import type { FormType } from "@/shared/form/types"

type BaseFormItem<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>
> = {
	name: Name
	transformValue?: (props: {
		value: PathValue<Form, Name>
	}) => ReactNode | null | undefined
	label?: string
	renderConditions: Path<Form>[]
	fallBack?: (key: string | number) => React.ReactElement
	className?: string
	disabled?: boolean
}

export type SwitchItem<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>
> = BaseFormItem<Form, Name> & {
	type: "switch"
}

export type DatePickerItem<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>
> = BaseFormItem<Form, Name> & {
	type: "datePicker"
}

export type TextAreaItem<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>
> = BaseFormItem<Form, Name> & {
	type: "textArea"
}

export type InputTextItem<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>
> = BaseFormItem<Form, Name> & {
	type: "inputText"
}

export type FixedItem<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>
> = BaseFormItem<Form, Name> & {
	type: "fixed"
}

export type InputFileItem<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>
> = BaseFormItem<Form, Name> & {
	type: "inputFile"
}

export type ToggleGroupItem<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>
> = BaseFormItem<Form, Name> & {
	type: "toggleGroup"
}

export type CustomizedItem<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>
> = BaseFormItem<Form, Name> & {
	type: "customized"
	customizeRender?: (
		form: FormType<Form>,
		key: string | number
	) => React.ReactNode
}

export type SectionFormItem<
	Form extends FieldValues,
	Name extends Path<Form> = Path<Form>
> =
	| SwitchItem<Form, Name>
	| DatePickerItem<Form, Name>
	| TextAreaItem<Form, Name>
	| InputTextItem<Form, Name>
	| FixedItem<Form, Name>
	| InputFileItem<Form, Name>
	| ToggleGroupItem<Form, Name>
	| CustomizedItem<Form, Name>

export type FormItemType<Form extends FieldValues = FieldValues> =
	SectionFormItem<Form>["type"]

export type SectionForm = {
	name: string
	className?: string
}
